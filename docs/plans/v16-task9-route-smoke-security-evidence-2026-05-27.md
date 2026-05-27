# v16 Task 9 route smoke and security coverage 证据

日期：2026-05-27
分支：`v16-task9-route-smoke-security`
基线：`main` 已包含 `f56b1fa Display v16 safe artifact previews`

## 范围

本任务只补测试和证据文档，为真实 console server route 增加 v16 handoff / safe preview smoke 与安全探针覆盖。没有修改产品代码、Workbench 源码、server 逻辑、依赖或 lockfile。

## Preflight

从 `main` 开始：

- `git checkout main && git pull --ff-only`：`Already up to date.`
- `git log --oneline --decorate -4`：HEAD 为 `f56b1fa`，Task 8 已在 `main`。
- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - `pnpm check`：通过。
  - `pnpm test`：555 个 tests，91 个 suites，555 pass，0 fail，duration `2991.640125ms`。
  - `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

之后创建分支：

- `git switch -c v16-task9-route-smoke-security`

## 实现

更新 `tests/workbench-route-smoke.test.js`：

- suite 标题更新为 v16 route smoke。
- route smoke fixture 新增真实注册 artifact：
  - `summaryArtifactPath`：`<temp>/artifacts/summary.json`，用于证明 registered safe preview 可读。
  - `harnessOutputPath`：`<temp>/artifacts/unsafe.html`，用于证明 HTML MIME 不 inline、不泄露 `<script>` 文本。
  - `contextArtifactPath`：仓库 `package.json`，用于证明注册引用指向 blocked repo file 时返回 403 且不泄露正文。
- GET allowlist 测试继续覆盖 `/api/handoff` 与 `/api/handoff/guided-goal-handoff.v1`，并确认 latest run 暴露注册 artifact refs。
- 新增 safe preview route smoke：
  - `GET /api/runs/task9-route-smoke-run/artifacts/summary/preview` 返回 200。
  - 返回 payload 通过 `validateSafeArtifactPreviewContract()`。
  - JSON artifact 只通过 `contentText` inline，payload 不包含本地 `path` 字段。
  - HTML artifact 返回 `text/html; charset=utf-8`，但 `previewAvailable:false`、`safeToRenderInline:false`，响应正文不包含 `<script>` 或 `alert`。
  - blocked `context` artifact 返回 403 `blocked-artifact-path`，不包含 `contentText`，不泄露仓库 `package.json` 内容。
- non-GET smoke 增加 preview route，覆盖 `POST`、`PUT`、`PATCH`、`DELETE`、`HEAD` 均返回 405，且不写 state。
- 新增 preview route traversal / arbitrary path probes：
  - query path：`?path=package.json` 返回 400。
  - encoded traversal artifact kind：`%2e%2e%2fpackage.json` 返回 400。
  - encoded traversal run id：`%2e%2e%2fpackage.json` 返回 400。
  - 未注册 artifact kind `package.json` 返回 404。
  - 未注册 artifact kind `task-packet` 返回 404。
- Workbench static smoke 增加 v16 evidence path，确认 `/workbench` 不覆盖 repo docs、`src`、package 或 lockfile 路径。
- `/workbench/api/summary`、`/workbench/api/handoff`、`/workbench/api/runs/latest`、`/workbench/api/runs/.../artifacts/.../preview` 只返回 Workbench HTML fallback，不返回 API JSON contract、handoff contract、safe preview contract 或 artifact 正文。
- `/workbench/docs/stages/v15-workbench-react-vite-migration.html` 与 `.stage.json` 返回 403/404，不返回 Workbench fallback 或 Stage Charter 正文。

## 验证

聚焦验证：

- `node --check tests/workbench-route-smoke.test.js && node --test tests/workbench-route-smoke.test.js tests/workbench-api-client.test.js tests/safe-artifact-preview-contract.test.js`
  - 21 个 tests，3 个 suites，21 pass，0 fail，duration `110.60125ms`。

完整验证：

- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - `pnpm check`：通过。
  - `pnpm test`：557 个 tests，91 个 suites，557 pass，0 fail，duration `3005.797542ms`。
  - `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

## 安全边界

- 没有新增产品功能。
- 没有新增依赖或 lockfile 变更。
- 没有放宽 static serving root。
- 没有新增浏览器执行面、写入控件或 mutation API。
- safe preview route 仍只读取 registered artifact ref，不接受 query path、encoded traversal 或任意 artifact kind。
- blocked repo file、HTML artifact、Workbench repo path 探针均未泄露仓库正文。
- 没有修改 v12 adoption safety boundary、v14 Stage boundary、v15 Workbench read-only boundary。

## Reviewer gate

独立 reviewer：`019e69c1-c54a-7fc0-8bff-57bcbd1c1b22`

结果：`APPROVED`

- Reviewer 未发现阻塞问题。
