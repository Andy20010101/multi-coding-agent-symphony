# v16 Task 10 docs and operator guide 证据

日期：2026-05-27
分支：`v16-task10-docs-operator-guide`
基线：`main` 已包含 `6a5a96d Add v16 route smoke security coverage`

## 范围

本任务只更新文档，补齐 v16 Guided Goal Handoff 与 safe artifact preview 的使用说明、操作边界、故障排查和已知限制。没有修改源码、测试、server、kernel、依赖或 lockfile。

## Preflight

从 `main` 开始：

- `git status -sb`：`main...origin/main`，Task 9 已推送到 `origin/main`。
- `git log --oneline --decorate -5`：HEAD 为 `6a5a96d Add v16 route smoke security coverage`，Task 9 已在 `main`。
- Task 9 合入后的主线验证：
  - `pnpm check`：通过。
  - `pnpm test`：557 个 tests，91 个 suites，557 pass，0 fail，duration `2992.80075ms`。
  - `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

之后创建分支：

- `git switch -c v16-task10-docs-operator-guide`

## 文档变更

`README.md`：

- Current Documents 增加本任务 evidence 链接。
- 当前实现列表补充 read-only Workbench 已展示 guided handoff details 与 safe artifact preview contracts。
- `symphony console` 说明更新为当前 v16 route 范围：
  - `GET /api/handoff`
  - `GET /api/handoff/<ref>`
  - `GET /api/runs/<run-id>/artifacts/<kind>/preview`
- 明确 Workbench 展示 guided handoff panel、safe preview status 和 copy-only commands。
- 明确 safe artifact preview 只读取 registered artifact refs，不接受用户路径。
- 明确 React Workbench 只有在后端 `safe-artifact-preview.v1` 返回 `safeToRenderInline === true` 且有 bounded text content 时才 inline 显示。
- 保留 release 状态：Latest completed mainline milestone 和 current released repository tag 仍为 `v15`。

`docs/workbench-operator-guide.md`：

- 标题更新为 v16 Workbench 中文操作指南。
- 当前定位补充 guided handoff、safe preview、read-only / display-only / copy-only 边界。
- 只读 API 列表补充 handoff routes 与 safe preview route。
- 新增 Guided Goal Handoff 说明：
  - 只读取 `/api/handoff` 和 `/api/handoff/guided-goal-handoff.v1`。
  - 只展示 contract 已暴露字段。
  - commands 只作为文本出现，不提供浏览器执行、branch、commit、push、模型或 agent 入口。
  - 缺字段时显示缺失或不可用，不从其他字段推断。
- 更新 Safe Artifact Preview 说明：
  - Workbench 只使用后端 artifact `uri`，不从 kind、path、扩展名、MIME 或内容片段拼接 route。
  - 列出必须由后端明确提供的 preview 字段。
  - 只有 `safe-artifact-preview.v1`、`previewAvailable === true`、`safeToRenderInline === true` 且有 `contentText` / `previewText` 时才 inline 显示。
  - HTML、JavaScript、SVG、binary、directory、missing、blocked、未知 MIME 和缺 safety 字段 payload 不作为正文渲染。
  - 记录后端 safe root、blocked basename / segment、symlink、hardlink、200 KiB 截断边界。
- Stage Charter 边界补充 `/workbench/docs/stages/*.html` 与 `.stage.json` 不由 React app 替代。
- 禁止能力补充 arbitrary path read、download artifact、open local file。
- 故障排查补充 handoff unavailable、HTML artifact 不显示正文、`blocked-artifact-path`、preview 字段缺失等场景。
- 已知限制更新为当前 v16 行为：artifact inline preview 只支持后端明确标记安全的 bounded text。

## 验证

- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - `pnpm check`：通过。
  - `pnpm test`：557 个 tests，91 个 suites，557 pass，0 fail，duration `3564.715709ms`。
  - `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

## 安全边界

- 没有修改源码、测试、server 或 kernel。
- 没有新增依赖或 lockfile 变更。
- 没有写未实现命令。
- 没有改变 release 状态；README 仍记录 latest completed mainline milestone 与 released tag 为 `v15`。
- 文档没有暗示 Workbench 可执行命令、调用模型、写入、下载 artifact、打开本地路径或读取任意文件。
- 文档继续要求前端不推断 artifact safety 字段。

## Reviewer gate

独立 reviewer：`019e69c1-c54a-7fc0-8bff-57bcbd1c1b22`

结果：`APPROVED`

- Reviewer 未发现阻塞问题。
