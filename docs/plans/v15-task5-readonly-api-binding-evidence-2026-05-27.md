# v15 Task 5 只读 API Binding Evidence

日期：2026-05-27

任务：实现只读 frontend API client / contract binding，让 React/Vite Workbench shell 能读取 Task 1 已冻结的只读 API contracts，并以低密度、只读、无执行控件的方式展示最小状态。

## 任务目标

本任务只实现 Task 5 范围：新增前端只读 API client、contract projection，并把 React shell 绑定到 `/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest`。页面只展示 Summary、Readiness、Latest Run、Runs Count、route contract 状态、adoption 只读摘要和 artifactRefs 只读摘要。

本任务不实现完整 Workbench 页面，不实现 artifact preview，不实现 adoption inspect 操作页面，不新增任何浏览器执行或写入入口。

## 前置状态

- Task 1 已冻结 Workbench console API fixture contracts，见 `docs/plans/v15-task1-api-fixtures-evidence-2026-05-27.md`。
- Task 2 已批准 React/Vite 依赖引入计划与前端目录布局，见 `docs/plans/v15-task2-react-vite-dependency-plan-2026-05-27.md`。
- Task 3 已受控引入 React/Vite direct dependencies，见 `docs/plans/v15-task3-react-vite-dependency-evidence-2026-05-27.md`。
- Task 4 已创建最小 React/Vite Workbench shell、收紧 Vite dev server `server.fs.allow`，见 `docs/plans/v15-task4-react-vite-shell-evidence-2026-05-27.md`。
- 本任务开始后没有运行 `pnpm add`。
- 本任务没有新增依赖。

## 变更文件

- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BGs_u4UL.css`
- `src/symphony/workbench-static/assets/index-C6idz3hS.js`
- `docs/plans/v15-task5-readonly-api-binding-evidence-2026-05-27.md`

`src/symphony/workbench-static/assets/index-CMht6lG2.css` 与 `src/symphony/workbench-static/assets/index-M-5RQZyi.js` 是 Task 4 旧构建产物，本任务运行 `pnpm workbench:build` 后由新的静态资产替换。

## 新增 API client 文件

- `frontend/workbench/src/api/client.js`：只读 API client，只暴露 GET 读取逻辑；所有 route 统一使用 `method: 'GET'`、`cache: 'no-store'` 和 `Accept: application/json`。
- `frontend/workbench/src/api/contracts.js`：只读 route manifest 与 projection / contract binding 层；缺失字段投影为“未暴露”，不可用状态投影为“不可用”，不伪造后端没有暴露的字段。

## 绑定的只读 API contracts

本任务只绑定以下四个 route：

| route | method | contract |
| --- | --- | --- |
| `/api/summary` | `GET` | `symphony.console-snapshot` |
| `/api/readiness` | `GET` | `symphony.console-readiness` |
| `/api/runs` | `GET` | `symphony.console-runs` |
| `/api/runs/latest` | `GET` | `symphony.console-run` |

本任务没有在 UI 中绑定 timeline、artifact preview 或 adoption inspect route。`/api/runs/<run-id>/timeline`、`/api/runs/<run-id>/artifacts/<kind>`、`/api/adoptions/<adoption-id>/inspect` 继续保留为后续任务范围。

## React shell 数据绑定说明

`frontend/workbench/src/App.jsx` 现在在页面加载时通过 `fetchWorkbenchContracts()` 读取只读 API，并展示：

- 加载中状态。
- 读取失败 / contract 未暴露 / 不可用状态。
- 无运行记录状态。
- Summary 状态卡。
- Readiness 状态卡。
- Latest Run 状态卡。
- Runs Count 状态卡。
- 已绑定 route 的 contractName / contractVersion 读取状态。
- adoption pending、dirtyBlocked、Git dirty readiness 的只读字段。
- artifactRefs 数量与 kind 摘要。

页面没有刷新按钮；本任务保持自动加载，不新增表单、菜单或操作入口。

## projection / contract binding 说明

`frontend/workbench/src/api/contracts.js` 只从 API response 中读取已暴露字段：

- `contractName`
- `contractVersion`
- `status`
- `overview.status`
- `overview.headline`
- `stageSummary.stageId`
- `stageSummary.status`
- `runStats.total`
- `latestRun.runId`
- `readiness.readOnly`
- `readiness.modelInvocation`
- `readiness.tools.git.dirty`
- `readiness.tools.git.dirtyFilesCount`
- `readiness.tools.packageManager.status`
- `runs.filter`
- `runs.availableFilters`
- `runs.runs.length`
- `latestRun.run.status`
- `latestRun.run.verifierStatus`
- `latestRun.run.modelInvocation`
- `latestRun.run.artifactRefs`
- `adoptionSummary.status`
- `adoptionSummary.pendingCount`
- `adoptionSummary.dirtyBlocked`

projection 不从路径、扩展名、内容、Stage Charter HTML、`.symphony` 私有结构或 raw run state 推断 UI 字段。缺失字段显示为“未暴露 / 不可用 / 等待 API contract 补充”。

## Task 1 deferred gaps 处理方式

以下 Task 1 deferred gaps 继续保持为后端 API contract 问题，不由 React 端推断或伪造：

- artifact preview 缺 `uri/ref`。
- 缺 `mime`。
- 缺 `title/displayTitle`。
- 缺 `safeToRenderInline`。
- 缺 `sourceRunId`。
- 缺 `artifactKind`。
- 缺 `previewAvailable`。
- 缺 `sizeBytes`。
- 没有 shared top-level `capabilities` object。
- error envelopes 仍是 route-local。
- dirty adoption 当前仍由 pending adoption 与 Git readiness 分别暴露；React 端不合成 dedicated dirty adoption contract。

## artifact preview 安全边界

- 本任务没有实现 artifact preview。
- 本任务没有调用 `/api/runs/<run-id>/artifacts/<kind>`。
- 本任务只展示 `artifactRefs` 数量和 `kind` 摘要。
- 本任务不把 `artifactRefs.path` 渲染成链接或浏览器可读取资源。
- 本任务不根据文件扩展名判断 `mime`。
- 本任务不根据路径或内容判断 `safeToRenderInline`。
- 本任务不伪造 `uri/ref`、`title/displayTitle`、`sourceRunId`、`artifactKind`、`previewAvailable`、`sizeBytes`。

## 浏览器执行控件禁止确认

- 本任务没有新增 `<button>`。
- 本任务没有新增 `<a>`。
- 本任务没有新增 `<form>`、`<input>`、`<select>`、`<textarea>`。
- 本任务没有新增 `onClick`、`onSubmit` 或 `addEventListener` handler。
- 本任务没有新增 `navigator.clipboard`。
- 本任务没有新增 write / execute / retry / adopt / apply / rollback / delete / install / model / mutation / audit 控件。
- API client 不实现 POST / PUT / PATCH / DELETE。
- non-OK response 只返回只读错误状态，不触发任何修复动作。

## Vite fs 安全边界确认

- 本任务没有修改 `frontend/workbench/vite.config.js`。
- `server.fs.strict` 仍为 `true`。
- `server.fs.allow` 仍为 `[workbenchRoot]`。
- `server.fs.allow` 没有放宽到仓库根目录、父目录、`src/symphony`、`docs`、`package.json` 或 `pnpm-lock.yaml`。
- 本任务没有配置 proxy。
- `tests/workbench-shell.test.js` 继续覆盖 Vite fs allow 边界。

## Stage Charter HTML / JSON 边界确认

- 本任务没有修改 `docs/stages/v15-workbench-react-vite-migration.stage.json`。
- 本任务没有修改或替换任何 `docs/stages/*.html`。
- React/Vite Workbench 没有读取、解析或替代 Stage Charter HTML。

## v12 adoption safety 边界确认

- 本任务没有修改 v12 adoption apply safety kernel。
- 本任务没有修改 v12 fingerprint verification。
- 本任务没有修改 v12 dirty worktree check。
- 本任务没有修改 `git apply --check` 相关逻辑。
- 本任务没有实现 adoption apply 操作。
- 本任务没有实现 adoption inspect 操作页面。

## v14 Stage kernel / gate 边界确认

- 本任务没有修改 v14 Stage kernel。
- 本任务没有修改 Stage gate。
- 本任务没有修改 blocked snapshot recovery。
- 本任务没有修改 verifier、policy engine、workspace manager 或 ArtifactStore 边界。
- 本任务没有修改 Task 1 API fixture contract。

## 未实现的内容

- 没有实现完整 Workbench 页面。
- 没有实现 Stage Dashboard parity。
- 没有实现 runs detail。
- 没有实现 timeline view。
- 没有实现 artifact preview。
- 没有实现 adoption inspect UI。
- 没有实现 adoption apply UI。
- 没有实现 copy command 控件。
- 没有实现 console server React bundle serving 或 legacy fallback 切换。
- 没有新增 diagnostics route。
- 没有新增 shared top-level capabilities object。
- 没有统一 error envelope。

## 验证命令

```sh
node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git diff -- package.json pnpm-lock.yaml
git status --short
pnpm workbench:dev -- --port 5173 --strictPort
curl -i "http://127.0.0.1:5173/@fs/$PWD/package.json"
curl -i "http://127.0.0.1:5173/@fs/$PWD/src/symphony/console.js"
```

本任务没有修改 Vite config 或 server 相关路径；仍额外执行了 `@fs` curl 负向 smoke，复核不能读取仓库根目录文件。

## 验证结果

- `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js`：通过，`9` tests，`9` pass，`0` fail。
- `pnpm check`：通过。
- `pnpm test`：通过，`527` tests，`527` pass，`0` fail。
- `pnpm workbench:build`：通过，输出 `src/symphony/workbench-static/index.html`、`src/symphony/workbench-static/assets/index-BGs_u4UL.css`、`src/symphony/workbench-static/assets/index-C6idz3hS.js`。命令期间出现 Node WASI experimental warning，不影响退出码。
- `git diff --check`：通过。
- `git diff -- package.json pnpm-lock.yaml`：通过，无输出，确认本任务没有修改 `package.json` 或 `pnpm-lock.yaml`。
- `git status --short`：通过复查，工作树只显示 Task 5 相关源码、测试、构建产物和 evidence 文档变更。
- 浏览器 smoke：通过。使用本地 Vite dev server 打开 `http://127.0.0.1:5173/`，页面标题为 `v15 Workbench`，H1 为 `v15 Workbench`，显示 `4` 个状态卡，绑定 route 为 `GET /api/summary`、`GET /api/readiness`、`GET /api/runs`、`GET /api/runs/latest`，`button, a, form, input, select, textarea` 计数为 `0`。
- `@fs` 负向 smoke：通过。`curl` 访问 `/@fs/$PWD/package.json` 与 `/@fs/$PWD/src/symphony/console.js` 均返回 `403 Forbidden`，没有返回文件内容。

## 延后事项

- 完整 Overview / Stage Dashboard parity 延后。
- Runs detail、timeline、artifacts、adoptions、diagnostics 视图延后。
- Artifact preview 等待 API contract 补齐 `uri/ref`、`mime`、`title/displayTitle`、`safeToRenderInline`、`sourceRunId`、`artifactKind`、`previewAvailable`、`sizeBytes`。
- Shared top-level `capabilities` object 继续作为 API contract 后续事项。
- Shared error envelope 继续作为 API contract 后续事项。
- Dedicated dirty adoption diagnostics contract 继续作为 API contract 后续事项。
- console server React bundle serving 与 legacy fallback 选择逻辑延后。

## reviewer checklist

- [ ] 确认本任务没有新增依赖。
- [ ] 确认本任务没有运行 `pnpm add`。
- [ ] 确认本任务没有修改 `pnpm-lock.yaml`。
- [ ] 确认本任务没有修改 `package.json`。
- [ ] 确认 API client route 清单只包含 `/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest`。
- [ ] 确认 API client 只使用 `GET`。
- [ ] 确认不存在 `POST` / `PUT` / `PATCH` / `DELETE`。
- [ ] 确认 projection 不伪造 Task 1 deferred gap 字段。
- [ ] 确认 React shell 没有浏览器执行控件、表单、菜单或 handler。
- [ ] 确认没有实现 artifact preview。
- [ ] 确认没有实现 adoption apply / inspect 操作页面。
- [ ] 确认没有修改 v12 adoption safety kernel。
- [ ] 确认没有修改 v14 Stage kernel / Stage gate。
- [ ] 确认没有修改 Task 1 API fixture contract。
- [ ] 确认没有放宽 Vite `server.fs.allow`。
- [ ] 确认没有替换 Stage Charter HTML。
- [ ] 确认验证命令全部通过。
