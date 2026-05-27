# v15 Task 4 React/Vite Workbench Shell Evidence

日期：2026-05-27

任务：创建最小 React/Vite Workbench shell 和构建入口，证明 React/Vite 构建链路和只读 Workbench 外壳成立。

## 任务目标

本任务只实现最小 React/Vite Workbench shell、Vite 构建配置和可验证的 package script。shell 是只读、低密度、copy-only 的静态展示面，不实现完整 Workbench UI，不接入写入或执行能力，不改变后端 kernel。

## 前置状态

- Task 1 已完成，`docs/plans/v15-task1-api-fixtures-evidence-2026-05-27.md` 已冻结 Workbench console API fixture contract 基线。
- Task 2 已完成，`docs/plans/v15-task2-react-vite-dependency-plan-2026-05-27.md` 已批准 React/Vite 依赖、前端目录布局、build script 策略和输出目录。
- Task 3 已完成，`docs/plans/v15-task3-react-vite-dependency-evidence-2026-05-27.md` 已受控引入 `react`、`react-dom`、`vite`、`@vitejs/plugin-react`。
- 当前 Task 4 开始后没有运行 `pnpm add`。

## 变更文件

- `package.json`
- `frontend/workbench/index.html`
- `frontend/workbench/vite.config.js`
- `frontend/workbench/src/main.jsx`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/workbench-static/index.html`（由 `pnpm workbench:build` 生成）
- `src/symphony/workbench-static/assets/index-M-5RQZyi.js`（由 `pnpm workbench:build` 生成）
- `src/symphony/workbench-static/assets/index-CMht6lG2.css`（由 `pnpm workbench:build` 生成）
- `tests/workbench-shell.test.js`
- `docs/plans/v15-task4-react-vite-shell-evidence-2026-05-27.md`

## 新增前端文件

- `frontend/workbench/index.html`：Vite HTML 入口，只挂载 `#root`。
- `frontend/workbench/vite.config.js`：最小 Vite 配置，使用 React plugin，输出到 `src/symphony/workbench-static`。
- `frontend/workbench/src/main.jsx`：React mount 入口。
- `frontend/workbench/src/App.jsx`：静态只读 shell。
- `frontend/workbench/src/styles/workbench.css`：Workbench shell 样式。

验证构建生成：

- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-M-5RQZyi.js`
- `src/symphony/workbench-static/assets/index-CMht6lG2.css`

## `package.json` script 变化

新增两个窄作用域 script：

```json
{
  "workbench:build": "vite build --config frontend/workbench/vite.config.js",
  "workbench:dev": "vite --host 127.0.0.1 --config frontend/workbench/vite.config.js"
}
```

没有修改既有 `test`、`check`、`bin`、`type`、`packageManager` 或无关 scripts。

## 依赖与 lockfile 边界确认

- 本任务没有新增依赖。
- 本任务没有运行 `pnpm add`。
- 本任务没有修改 `pnpm-lock.yaml`。
- 本任务没有修改 Task 3 已批准的 `react`、`react-dom`、`vite`、`@vitejs/plugin-react` 版本。

## review blocker 修复

本次修复 v15 Task 4 review 的两个 blocker，不扩展 Task 4 范围，不开始 Task 5：

- `frontend/workbench/vite.config.js` 已显式设置 `server.fs.strict: true`。
- `frontend/workbench/vite.config.js` 已显式设置 `server.fs.allow: [workbenchRoot]`，只允许 Workbench frontend 根目录作为项目侧可服务范围。
- `server.fs.allow` 没有包含仓库根目录、`..`、`process.cwd()` 或 `searchForWorkspaceRoot(process.cwd())`。
- 没有配置 proxy。
- 通过本地 Vite dev server `@fs` 负向 smoke 复查：`package.json`、`src/symphony/console.js`、`docs/plans/v15-task4-react-vite-shell-evidence-2026-05-27.md` 均返回 `403`。
- `docs/plans/project_prompt_md_language_requirements.md` 不属于 Task 4 变更，已移出仓库工作树并备份到 `/tmp/project_prompt_md_language_requirements.md`。

## Vite 配置说明

- `root` 固定为 `frontend/workbench`。
- `plugins` 只使用 Task 3 已引入的 `@vitejs/plugin-react`。
- `server.fs.strict` 显式为 `true`。
- `server.fs.allow` 显式为 `[workbenchRoot]`，没有放宽到仓库根目录、父目录、`src/symphony`、`docs`、`package.json` 或 `pnpm-lock.yaml`。
- `build.outDir` 指向 Task 2 approved 的 `src/symphony/workbench-static`。
- `build.modulePreload.polyfill` 关闭，避免静态 shell 产物包含 Vite 默认 modulepreload `fetch` polyfill。
- `build.minify` 与 `build.cssMinify` 关闭，避免当前 Codex 内置 Node 在 macOS 下加载 native minifier binding；shell 构建仍输出静态展示资产。
- 没有配置 proxy。
- 没有配置任意本地文件读取。
- 没有绕过 `/api/*` 只读边界。
- 没有覆盖 `docs/stages` 或 Stage Charter HTML。

## React shell 说明

React shell 只展示静态内容：

- v15 Workbench 标题。
- 只读、低密度、copy-only 状态说明。
- 当前 Task 4 边界说明。
- 后续将绑定的只读 API contract 列表。
- 无浏览器执行控件的安全提示。
- Summary、Readiness、Runs、Artifacts、Adoption 静态占位区块。
- Task 1 deferred gaps 的静态提醒。

shell 没有 API client、没有 `fetch`、没有 browser storage、没有 service worker、没有文件输入、没有任意路径输入。

## 测试覆盖说明

- `tests/workbench-shell.test.js` 增加 Vite dev server filesystem safety 覆盖。
- 测试静态读取 `frontend/workbench/vite.config.js`，断言 `server.fs.strict` 为 `true`。
- 测试断言 `server.fs.allow` 只使用 `workbenchRoot`，不包含仓库根目录、父目录、`process.cwd()`、`searchForWorkspaceRoot`、`src/symphony`、`docs`、`package.json` 或 `pnpm-lock.yaml`。
- 测试继续断言没有危险 proxy。

## 只读边界确认

- 本任务没有新增浏览器写入能力。
- 本任务没有新增模型调用入口。
- 本任务没有新增 mutation gate、audit、真实 CLI 或 agent 调用入口。
- 本任务没有让浏览器端直接读取任意本地文件。
- React shell 只渲染静态文本和静态列表。

## 禁止浏览器执行控件确认

- 页面没有 `<button>`。
- 页面没有 `<a>`。
- 页面没有 `<form>`、`<input>`、`<select>`、`<textarea>`。
- 页面没有 `onClick`、`onSubmit` 或 `addEventListener` handler。
- 页面没有 `navigator.clipboard`。
- 禁止能力只作为纯文本边界说明存在，不是按钮、链接、表单、菜单项或可点击控件。

## API contract 边界确认

- 本任务没有接入 API。
- 本任务没有实现复杂 frontend API client。
- 本任务没有修改 `/api/summary`、`/api/readiness`、runs、timeline、artifacts、adoptions route。
- 本任务没有修改 Task 1 API fixture contract。
- 后续 API contract 列表只作为静态展示，React 端不从响应、路径、Stage Charter HTML 或 `.symphony` 私有结构推断字段。

## Task 1 deferred gaps 处理方式

以下 gap 继续保持为 API contract 问题，不由 React 端推断或伪造：

- artifact preview 缺 `uri/ref`。
- 缺 `mime`。
- 缺 `title/displayTitle`。
- 缺 `safeToRenderInline`。
- 缺 `sourceRunId`。
- 缺 `artifactKind`。
- 缺 `previewAvailable`。
- 缺 `sizeBytes`。
- 没有 shared top-level capabilities object。
- error envelopes 仍是 route-local。
- dirty adoption 当前由 pending adoption + dirty Git readiness 派生。

## Stage Charter HTML / JSON 边界确认

- 本任务没有修改 `docs/stages/v15-workbench-react-vite-migration.stage.json`。
- 本任务没有修改或替换任何 `docs/stages/*.html`。
- React/Vite Workbench shell 不读取、不解析、不替代 Stage Charter HTML。

## v12 adoption safety 边界确认

- 本任务没有修改 v12 adoption apply safety kernel。
- 本任务没有修改 v12 fingerprint verification。
- 本任务没有修改 v12 dirty worktree check。
- 本任务没有修改 `git apply --check` 相关逻辑。
- 本任务没有实现 adoption inspect UI。

## v14 Stage kernel / gate 边界确认

- 本任务没有修改 v14 Stage kernel。
- 本任务没有修改 Stage gate。
- 本任务没有修改 blocked snapshot recovery。
- 本任务没有修改 verifier、policy engine、workspace manager 或 ArtifactStore 边界。

## 未实现的内容

- 没有实现完整 Workbench UI。
- 没有实现真实 Stage overview 数据绑定。
- 没有实现 runs view。
- 没有实现 timeline view。
- 没有实现 artifact preview UI。
- 没有实现 adoption inspect UI。
- 没有实现 frontend API client。
- 没有实现 console server React bundle serving。
- 没有修改 legacy fallback。

## 验证命令

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git diff -- package.json pnpm-lock.yaml
git status --short
```

## 验证结果

- `node --test tests/workbench-shell.test.js`：通过，`4` tests，`4` pass，`0` fail。
- `pnpm check`：通过。
- `pnpm test`：通过，`522` tests，`522` pass，`0` fail。
- `pnpm workbench:build`：通过，输出 `src/symphony/workbench-static/index.html`、`assets/index-M-5RQZyi.js`、`assets/index-CMht6lG2.css`。命令期间出现 Node WASI experimental warning，不影响退出码。
- `git diff --check`：通过。
- `git diff -- package.json pnpm-lock.yaml`：通过，输出只显示 `package.json` 新增 `workbench:build` 与 `workbench:dev` scripts；`pnpm-lock.yaml` 没有 diff。
- `git status --short`：通过复查，未显示 `docs/plans/project_prompt_md_language_requirements.md`；当前只显示 Task 4 相关变更文件。
- 浏览器验证：通过。使用本地 Vite dev server 打开 `http://127.0.0.1:5173/`，页面标题为 `v15 Workbench`，H1 为 `v15 Workbench`，后续 API contract 文本可见，`button, a, form, input, select, textarea` 计数为 `0`。
- `@fs` 负向 smoke：通过。`curl` 访问 `/@fs/.../package.json`、`/@fs/.../src/symphony/console.js`、`/@fs/.../docs/plans/v15-task4-react-vite-shell-evidence-2026-05-27.md` 均返回 `403`。

补充说明：当前 Codex 内置 Node 在 macOS 下不能直接加载 Rolldown / lightningcss native binding。验证前执行过 `pnpm install --force --frozen-lockfile` 重建本地 `node_modules` optional packages；该命令没有修改 `package.json` 或 `pnpm-lock.yaml`，也没有新增依赖。

## 延后事项

- console server React bundle serving 与 legacy fallback 选择逻辑延后。
- Workbench API client 与 contract guard 延后。
- Overview、Runs、Timeline、Artifacts、Adoption、Diagnostics 真实视图延后。
- Artifact preview 继续等待 Task 1 deferred contract gaps 由 API contract 补齐。
- Shared top-level `capabilities` object 与 shared error envelope 继续作为 API contract 后续事项。

## reviewer checklist

- [ ] 确认本任务没有新增依赖。
- [ ] 确认本任务没有运行 `pnpm add`。
- [ ] 确认本任务没有修改 `pnpm-lock.yaml`。
- [ ] 确认 `package.json` 只新增 Task 2 允许的 `workbench:build` 与 `workbench:dev` scripts。
- [ ] 确认前端源码位于 `frontend/workbench`，没有放入 `src/symphony`。
- [ ] 确认 Vite build output 指向 `src/symphony/workbench-static`。
- [ ] 确认页面没有按钮、链接、表单、菜单项或可点击执行控件。
- [ ] 确认没有实现完整 Workbench UI。
- [ ] 确认没有实现 artifact preview。
- [ ] 确认没有实现 adoption inspect UI。
- [ ] 确认没有修改 Task 1 API fixture contract。
- [ ] 确认没有修改 v12 adoption safety kernel。
- [ ] 确认没有修改 v14 Stage kernel / gate。
- [ ] 确认没有替换 Stage Charter HTML。
- [ ] 确认没有让 React 端推断 Task 1 deferred contract gaps。
- [ ] 确认验证命令全部通过。
