# v15 Workbench 中文操作指南

本文面向本地操作者和 reviewer，说明当前 v15 Workbench 的构建、启动、只读安全边界、故障排查和已知限制。它只描述当前仓库已支持的命令和路由，不预告未来能力。

## 当前定位

v15 Workbench 是 `symphony console` 提供的本地浏览器展示面。它消费 console server 暴露的本地 `GET` API，用于查看 `.symphony` 摘要、latest run、readiness、timeline、artifact refs、adoption summary 和 Stage summary。

Workbench 是 read-only / display-only / copy-only：

- 浏览器只展示状态和仅复制命令文本。
- 浏览器不执行命令，不写文件，不触发模型，不触发 agent。
- 浏览器不是 canonical state；`.symphony` 仍只保存 summary、ref、pointer，完整 evidence 继续由 ArtifactStore 承担。

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

它来自 `package.json`，执行 Vite dev server：`vite --host 127.0.0.1 --config frontend/workbench/vite.config.js`。该脚本用于前端源码调试；操作者验证 console API parity 和静态服务边界时，仍以 `pnpm workbench:build` 加 `symphony console` 为准。

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
- `http://127.0.0.1:8765/workbench/` 是 v15 React/Vite Workbench 入口。
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
GET /api/runs
GET /api/runs/latest
GET /api/runs/<run-id>
GET /api/runs/<run-id>/timeline
GET /api/runs/<run-id>/artifacts/<kind>
GET /api/adoptions/<adoption-id>/inspect
```

所有非 `GET` 请求都必须返回 `405`，响应语义是 console read-only。`/workbench` 的静态资源服务只允许读取 `src/symphony/workbench-static/` 中的构建产物；`/api/*`、非 Workbench route、Stage Charter route 和仓库文件路径不能被 React fallback 吞掉。

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

这些词如果出现在 Workbench 数据里，只能是只读状态、字段名、历史 run 信息、copy-only command 文本或文档说明。浏览器端不能把它们接成按钮、表单、链接、handler、HTTP mutation、terminal action、模型调用、真实 agent 调用或 package installer。

## Artifact Preview 边界

当前 v15 React/Vite Workbench 只能展示 API 已暴露的 artifact refs 和 preview field 状态。以下字段如果未由 API contract 明确暴露，前端必须显示为“未暴露”“不可用”或“等待 API contract 补充”，不能根据路径、扩展名、kind、内容片段或 legacy preview 行为自行推断：

- `safeToRenderInline`
- `mime`
- `previewAvailable`
- `artifactKind`
- `sourceRunId`
- `sizeBytes`
- `displayTitle`
- `uri`
- `ref`

因此，当前 React Workbench 不实现 artifact inline preview，不提供任意路径输入，不读取未注册 artifact，不把本地路径解释成可渲染媒体。

## Stage Charter 边界

Stage Charter JSON / HTML 是独立的 Stage display artifact：

- JSON 路径形如 `docs/stages/<stage-id>.stage.json`。
- HTML 路径形如 `docs/stages/<stage-id>.html`。
- Stage Charter JSON 是机器源，HTML 是生成后的展示产物，并参与一致性检查。

v15 React/Vite Workbench 不替换、不编辑、不解析 Stage Charter HTML / JSON。Console server 中 `/workbench` app route fallback 只覆盖 Workbench 路由；`/docs/stages/*.html` 和 `/docs/stages/*.stage.json` 不会被 React app 替代。

## 故障排查

`/workbench/` 返回 404 或资源缺失：

先运行 `pnpm workbench:build`，确认 `src/symphony/workbench-static/index.html` 和 `src/symphony/workbench-static/assets/` 存在。不要把缺失资源问题修成任意目录静态服务。

端口 `8765` 被占用：

使用当前已支持的 `--port` 参数，例如 `pnpm symphony console --port 8766`。仍建议绑定 `127.0.0.1`。

Workbench 显示没有 runs：

这是合法状态。可以在终端运行 `pnpm symphony scan` 生成本地只读 scan state，再重新打开或刷新 Workbench。

在 `pnpm workbench:dev` 页面看到 API 读取失败：

`workbench:dev` 是前端源码调试入口，不是完整 console server parity 验证入口。使用 `pnpm workbench:build` 后通过 `pnpm symphony console` 访问 `/workbench/`。

看到 `405`：

这是安全边界，不是故障。Workbench 和 `/api/*` 当前只接受 `GET`；写入、执行、采纳、回滚、删除、安装、mutation、audit 和模型调用必须保持不可由浏览器触发。

Artifact preview 字段缺失：

按 contract gap 处理。前端不能推断 `safeToRenderInline`、`mime`、`previewAvailable`、`artifactKind` 等字段；需要等待后端 API contract 明确补充。

Stage Charter HTML / JSON 没有在 Workbench 中打开：

这是预期边界。Stage Charter 文件不是 React Workbench 的替代页面，也不由 `/workbench` fallback 服务。

## 已知限制

- React/Vite Workbench 当前是只读展示层，不是执行面。
- 当前 React frontend 只消费受控 `GET` contract；不直接读取 `.symphony` 私有结构、ArtifactStore 内部结构或 Stage Charter HTML。
- Artifact inline preview 仍未实现；缺失 preview safety 字段时必须显示缺口。
- 没有 browser write、execute、retry、adopt、apply、rollback、delete、install、mutation、audit、model invocation。
- 没有任意本地文件读取、任意路径输入或任意 artifact 预览。
- `/` 仍保留既有 console HTML；React/Vite Workbench 当前入口是 `/workbench/`。
- Stage Charter HTML / JSON 继续独立存在，不被 React Workbench 替换。
