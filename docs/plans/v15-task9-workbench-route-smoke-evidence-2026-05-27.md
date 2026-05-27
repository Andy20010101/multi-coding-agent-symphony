# v15 Task 9 Workbench route smoke and server parity Evidence

日期：2026-05-27

## 任务目标

本任务在 Task 8 的 Workbench 静态服务基础上，增加 console server route smoke 和只读 API parity 测试。重点是验证 `/workbench` 浏览器入口、静态 asset、fallback / 404、安全文件边界、非 Workbench route 边界，以及 `/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest` 继续保持只读 GET 行为。

本任务不实现新 UI 功能，不新增写入 endpoint，不新增执行控件，不修改 Task 1 API contract，不修改 v12 / v14 kernel。

## 变更文件

- `tests/workbench-route-smoke.test.js`
- `docs/plans/v15-task9-workbench-route-smoke-evidence-2026-05-27.md`

未修改：

- `src/symphony/console.js`
- `frontend/workbench/src/*`
- `package.json`
- `pnpm-lock.yaml`

## route smoke 覆盖

新增 `tests/workbench-route-smoke.test.js`，通过真实 `createSymphonyConsoleServer` 启动本地随机端口服务，使用临时 `.symphony` fixture 和假的 readiness runner，避免测试依赖本机工具状态。

覆盖内容：

- `/workbench` 与 `/workbench/` 返回 Workbench HTML 入口。
- HTML 入口包含 React mount root，并引用 `/workbench/assets/index-*.js` 与 `/workbench/assets/index-*.css`。
- JS / CSS asset 返回 `200`，带正确 `Content-Type`、`cache-control: no-store`、`x-content-type-options: nosniff`。
- `/workbench/runs/<run-id>` 这类无扩展名 app route 按 Task 8 设计 fallback 到 `index.html`。
- `/workbench/assets/missing.js` 与 `/workbench/missing.css` 返回 `404`，不会 fallback 到 React HTML。
- 根路径 `/assets/*` 不提供 Workbench asset。

## server parity 覆盖

API GET parity 覆盖：

- `GET /api/summary` 返回 `symphony.console-snapshot`，并能读取 latest run。
- `GET /api/readiness` 返回 `symphony.console-readiness`，保持 `readOnly: true`、`modelInvocation: false`。
- `GET /api/runs` 返回 `symphony.console-runs`。
- `GET /api/runs/latest` 返回 `symphony.console-run`。

非 GET 覆盖：

- 对 `/workbench/`、`/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest` 分别发送 `POST`、`PUT`、`PATCH`、`DELETE`、`HEAD`。
- 所有非 GET 请求均返回 `405`。
- 非 `HEAD` 的 `405` 响应不返回 React fallback HTML。
- 测试比较请求前后临时 `stateDir` 的文本文件快照，确认非 GET 没有触发 state 写入。

## React fallback 边界

测试确认：

- `/` 仍返回 legacy console HTML，不被 React Workbench 替换。
- `/not-workbench/<run-id>` 返回 JSON `404`，不被 React fallback 覆盖。
- `/docs/stages/v15-workbench-react-vite-migration.html` 返回 JSON `404`，不被 React fallback 覆盖。
- `/docs/stages/v15-workbench-react-vite-migration.stage.json` 返回 JSON `404`，不被 React fallback 覆盖。

## 本地文件与 traversal 边界

测试确认以下路径不会通过 `/workbench` 读取仓库文件内容：

- `/workbench/package.json`
- `/workbench/pnpm-lock.yaml`
- `/workbench/src/symphony/console.js`
- `/workbench/docs/plans/v15-task8-workbench-static-serving-evidence-2026-05-27.md`
- `/workbench/%2e%2e/package.json`
- `/workbench/..%2fpackage.json`
- `/workbench/%2e%2e%2fpnpm-lock.yaml`
- `/workbench/%2e%2e%2fsrc%2fsymphony%2fconsole.js`
- `/workbench/%2e%2e%2fdocs%2fplans%2fv15-task8-workbench-static-serving-evidence-2026-05-27.md`
- `/workbench/%5c..%5cpackage.json`

这些请求返回 `403` 或 `404`，响应体不包含 `package.json`、`pnpm-lock.yaml`、`src/symphony/console.js` 或 Task 8 evidence 的内容特征。

## 安全边界确认

- 没有新增依赖。
- 没有修改 `package.json`。
- 没有修改 `pnpm-lock.yaml`。
- 没有修改 `src/symphony/console.js`。
- 没有修改 Workbench 前端源码。
- 没有新增 `POST` / `PUT` / `PATCH` / `DELETE` route。
- 没有新增浏览器执行控件。
- 没有新增写入 API。
- 没有新增 artifact inline preview。
- 没有推断 `safeToRenderInline`、`mime`、`previewAvailable`、`artifactKind`、`sourceRunId`、`sizeBytes`、`displayTitle`、`uri/ref`。
- 没有修改 Task 1 API contract。
- 没有修改 v12 adoption safety kernel。
- 没有修改 v14 Stage kernel / gate。

## 验证命令

```sh
node --test tests/workbench-route-smoke.test.js
pnpm check
pnpm test
pnpm workbench:build
git add -N tests/workbench-route-smoke.test.js docs/plans/v15-task9-workbench-route-smoke-evidence-2026-05-27.md
git diff --check
git diff -- package.json pnpm-lock.yaml
```

## 验证结果

- `node --test tests/workbench-route-smoke.test.js`：通过，`5` tests，`5` pass，`0` fail。
- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`538` tests，`538` pass，`0` fail。
- `pnpm workbench:build`：通过，退出码 `0`；构建产物仍为 `src/symphony/workbench-static/index.html`、`src/symphony/workbench-static/assets/index-J_tkNlVv.css`、`src/symphony/workbench-static/assets/index-nLv-wKCK.js`。命令出现 Node WASI experimental warning，不影响退出码。
- `git add -N tests/workbench-route-smoke.test.js docs/plans/v15-task9-workbench-route-smoke-evidence-2026-05-27.md`：通过，无输出，用于让新增未跟踪文件进入 diff 审查。
- `git diff --check`：通过，无输出，覆盖新增测试文件与 evidence 文件。
- `git diff -- package.json pnpm-lock.yaml`：无输出，确认没有修改 `package.json` 或 `pnpm-lock.yaml`。

## 扩展验证结果

parent 已完成完整验证：`pnpm check`、`pnpm test`、`pnpm workbench:build` 均通过。`pnpm workbench:build` 期间出现 Node WASI experimental warning，但命令退出码为 `0`。

## parent 注意事项

- `pnpm workbench:build` 后构建产物仍为 `src/symphony/workbench-static/index.html`、`src/symphony/workbench-static/assets/index-J_tkNlVv.css`、`src/symphony/workbench-static/assets/index-nLv-wKCK.js`。
- `git diff -- package.json pnpm-lock.yaml` 无输出，确认本任务未修改依赖清单或 lockfile。
