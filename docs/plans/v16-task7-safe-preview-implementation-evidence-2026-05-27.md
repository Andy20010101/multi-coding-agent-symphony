# v16 Task 7 safe artifact preview implementation 证据

日期：2026-05-27
分支：`v16-task7-safe-preview-implementation`
基线：`main` 已包含 `2b1cd19 Add v16 safe artifact preview fixtures`

## 范围

本任务实现后端 safe artifact preview route 和 snapshot preview 字段。实现只读取 run state 中已登记的 artifact ref，不接受 query path、path traversal 或任意本地文件路径。Workbench preview 消费仍留给 Task 8。

## Preflight

从 `main` 开始：

- `git checkout main && git pull`：`Already up to date.`
- `git status -sb`：`## main...origin/main`
- `git log --oneline --decorate -8`：HEAD 为 `2b1cd19`，Task 6 已在 `main`。

通用 preflight：

- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - `pnpm check`：通过。
  - `pnpm test`：553 个 tests，91 个 suites，553 pass，0 fail，duration `3345.975542ms`。
  - `pnpm workbench:build`：通过，输出 `index-BNWPIsAg.js` 和 `index-BdBWycDT.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

之后创建分支：

- `git switch -c v16-task7-safe-preview-implementation`

## 后端 route

新增 canonical preview route：

- `GET /api/runs/<run-id>/artifacts/<artifact-kind>/preview`
- 返回 root-level `safe-artifact-preview.v1` contract。
- `ref` 由 run id 和 artifact kind 生成 opaque ref，不使用文件路径。
- `uri` 使用受控 `/api/runs/<run-id>/artifacts/<artifact-kind>/preview`。
- `downloadAvailable` 固定为 `false`。
- 非 GET 仍走 console 全局只读保护，返回 `405`。

旧 route 保留：

- `GET /api/runs/<run-id>/artifacts/<artifact-kind>`
- 返回 `symphony.console-artifact` wrapper。
- wrapper 内的内容由 safe preview 派生；HTML、script、binary、directory 不再返回 inline content。
- safe preview contract 作为 `artifact.safePreview` 暴露，旧 JSON/text 预览只在 `safeToRenderInline === true` 时生成。

## 注册引用边界

route 只查找 `compactRunState(runState).artifactRefs` 中已登记的 artifact kind：

- 未登记 kind 返回 `404`。
- query string 返回 `400 invalid-ref`，例如 `?path=package.json`。
- encoded traversal 返回 `400 invalid-ref`，例如 `%2e%2e%2fpackage.json`。
- 已登记 artifact path 只有位于 `stateDir` 内部或 `stateDir` 同级 `artifacts/` 下时才允许读取。
- 已登记 artifact path 如果指向 allowlist 之外的本地文件，例如仓库 `README.md`，返回 `403 blocked-artifact-path`，不读取文件内容。
- 已登记 artifact path 如果指向 `package.json`、lockfile、`src/*` 或 `docs/*`，返回 `403 blocked-artifact-path`，不读取文件内容。
- 已登记 artifact path 如果是 symlink，也返回 `403 blocked-artifact-path`，不 follow symlink。
- 已登记 artifact path 如果是多硬链接文件，也返回 `403 blocked-artifact-path`，避免 allowlist 内路径硬链接到外部本地文件后被读取。
- route 不读取 `package.json`、`pnpm-lock.yaml`、`src/*`、`docs/*` 等任意仓库文件。

snapshot 中的 `latestRun.artifactRefs` 增加后端生成字段：

- `ref`
- `uri`
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

## MIME 和 inline 规则

后端按路径扩展名设置 MIME，前端不参与推断：

- 可 inline 的类型：`application/json`、`text/plain`、`text/markdown`、`text/csv`、`text/x-diff`、`text/x-patch`。
- 不 inline 的类型：`text/html`、`application/javascript`、`image/svg+xml`、常见图片、PDF、unknown binary、directory。
- safe text 只读取 `maxPreviewBytes = 204800` 字节。
- 超过限制的 safe text 设置 `truncated: true` 和 `truncationReason: size-exceeds-max-preview-bytes`。
- 空文件、missing file、directory、unsafe MIME 都不带 `contentText` 或 `previewText`。

## Tests

更新 `tests/symphony-cli.test.js`：

- `keeps console artifact previews bounded to registered refs`
  - directory 不再返回 entries。
  - query path probe 变为 `400 invalid-ref`。
  - legacy wrapper 仍保留 safe text 的 bounded content。
- `serves v16 safe artifact preview contracts for registered artifacts only`
  - safe JSON 通过 `validateSafeArtifactPreviewContract()`。
  - HTML artifact 返回 `previewAvailable: false`、`safeToRenderInline: false`，响应体不包含 `<script>` 或 `alert`。
  - binary artifact 返回 `application/octet-stream`，无 inline content。
  - oversize text 截断到 `204800` 字节。
  - 已登记 `contextArtifactPath` 指向仓库 `package.json` 时返回 `403 blocked-artifact-path`，响应体不包含 package 内容。
  - 已登记 `scaffoldPlanArtifactPath` 是指向仓库 `package.json` 的 symlink 时返回 `403 blocked-artifact-path`，响应体不包含 package 内容。
  - 已登记 `adoptionPlanArtifactPath` 是 allowlist 内硬链接文件，目标内容来自 allowlist 外本地 JSON 时返回 `403 blocked-artifact-path`，响应体不包含该 JSON 内容。
  - 已登记 `adoptionJournalArtifactPath` 指向仓库 `README.md` 时返回 `403 blocked-artifact-path`，响应体不包含 README 内容。
  - POST preview route 返回 `405`。
  - query path、encoded traversal、未登记 kind 都不暴露仓库文件内容。

更新 v15 console route fixture 断言：

- legacy artifact wrapper 暴露 safe preview 字段。
- directory preview 不再列出目录项。
- missing artifact wrapper 保留 `missing-artifact` 状态，同时暴露不可预览字段。

## 本地验证

聚焦验证：

- `node --check src/symphony/console.js && node --check tests/symphony-cli.test.js`
  - 通过。
- `node --test tests/symphony-cli.test.js tests/workbench-route-smoke.test.js tests/safe-artifact-preview-contract.test.js`
  - 64 个 tests，7 个 suites，64 pass，0 fail，duration `1366.729291ms`。

完整验证：

- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - `pnpm check`：通过。
  - `pnpm test`：554 个 tests，91 个 suites，554 pass，0 fail，duration `2940.919459ms`。
  - `pnpm workbench:build`：通过，输出 `index-BNWPIsAg.js` 和 `index-BdBWycDT.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

边界扫描：

- `rg -n "downloadAvailable\\s*:\\s*true|\\\"downloadAvailable\\\"\\s*:\\s*true" src/symphony/console.js src/symphony/safe-artifact-preview.js tests/symphony-cli.test.js fixtures/contracts/safe-artifact-preview*.json`
  - 无输出，exit code 1。
- `rg -n "file://|createReadStream|writeFile\\(|execFile\\(|execSync\\(|spawn\\(|child_process|XMLHttpRequest|WebSocket|dangerouslySetInnerHTML" src/symphony/console.js`
  - 无输出，exit code 1。
- `rg -n "hardlink-summary|outsideLocalSecret|artifacts/.*/preview\\?path|%2e%2e%2fpackage\\.json|method: 'POST'|text/html; charset=utf-8|application/octet-stream|size-exceeds-max-preview-bytes" tests/symphony-cli.test.js`
  - 命中 route/security 测试覆盖：hardlink、query path、encoded traversal、POST、HTML、binary、oversize truncation。

## 保留限制

- 没有 Workbench preview UI。
- 没有新增下载或打开本地路径能力。
- 没有新增写入、执行、model、audit、mutation route。
- 没有 dependency 或 lockfile 变更。
- 没有修改 v12/v14/v15 adoption safety boundary。

## Reviewer gate

第一次独立 reviewer：`019e69c1-c54a-7fc0-8bff-57bcbd1c1b22`

结果：`NEEDS_REVISION`

Reviewer 发现一个 blocking 问题：

- 如果 run state 中的已登记 artifact path 指向仓库 `package.json`，canonical safe preview route 会把它当成 `application/json` safe text 返回。legacy wrapper 也会从同一个 preview 派生内容。本证据原先写的“不读取 package.json、pnpm-lock.yaml、src/*、docs/*”在这个场景下不成立。

修复内容：

- `previewArtifact()` 在 `stat()` 和 `open()` 前先检查 path。
- `package.json`、`package-lock.json`、`pnpm-lock.yaml`、`yarn.lock`、`src` segment、`docs` segment 命中后返回 `403 blocked-artifact-path`。
- blocked preview 仍返回 `safe-artifact-preview.v1` payload，但 `previewAvailable: false`、`safeToRenderInline: false`，不带 `contentText` 或 `previewText`。
- snapshot descriptor 同步标记 `previewStatus: blocked-artifact-path`，不读取文件。
- `tests/symphony-cli.test.js` 增加回归：已登记 `contextArtifactPath` 指向仓库 `package.json` 时，preview route 返回 `403`，payload 通过 validator，响应体不包含 package 内容。

修复后验证：

- `node --check src/symphony/console.js && node --check tests/symphony-cli.test.js && node --test tests/symphony-cli.test.js tests/workbench-route-smoke.test.js tests/safe-artifact-preview-contract.test.js`
  - 通过；64 个 tests，7 个 suites，64 pass，0 fail，duration `1369.457917ms`。
- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - 通过；全量测试 554 个 tests，91 个 suites，554 pass，0 fail，duration `2901.265584ms`。

第二次独立 reviewer 复审结果：`NEEDS_REVISION`

Reviewer 发现一个 symlink 绕过：

- artifact path 本身是安全 basename，例如 `artifacts/summary.json`，但它是指向仓库 `package.json` 的 symlink。原实现只检查 path 字符串，`stat()` 和 `open()` 会 follow symlink，仍可能返回 package 内容。

第二次修复内容：

- `previewArtifact()` 和 snapshot descriptor 在 `stat()` 前调用 `lstat()`。
- `metadata.isSymbolicLink()` 为 true 时直接返回 `403 blocked-artifact-path`。
- 常规文件会对 `realpath()` 结果再执行 blocked path 检查。
- `tests/symphony-cli.test.js` 增加回归：已登记 `scaffoldPlanArtifactPath` 指向 `artifacts/linked-summary.json`，该文件是到仓库 `package.json` 的 symlink，preview route 必须返回 `403`，payload 通过 validator，响应体不包含 package 内容。

第二次修复后验证：

- `node --check src/symphony/console.js && node --check tests/symphony-cli.test.js && node --test tests/symphony-cli.test.js tests/workbench-route-smoke.test.js tests/safe-artifact-preview-contract.test.js`
  - 通过；64 个 tests，7 个 suites，64 pass，0 fail，duration `1367.658791ms`。
- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - 通过；全量测试 554 个 tests，91 个 suites，554 pass，0 fail，duration `3000.131417ms`。

第三次独立 reviewer 复审结果：`NEEDS_REVISION`

Reviewer 发现 blocklist 仍不足：

- 已登记 artifact path 指向仓库 `README.md` 时不会命中 package/lock/src/docs blocklist，仍可作为 text preview 返回。这仍属于任意本地文件暴露。

第三次修复内容：

- preview 读取边界改为 allowlist。
- 只有 `stateDir` 内部和 `stateDir` 同级 `artifacts/` 下的 path 可以进入 `stat()` / `open()`。
- 对 `realpath()` 后的路径也使用同一 allowlist，避免 macOS `/tmp`/`/private/tmp` 这类规范化路径误判。
- 已登记 `README.md` 回归测试加入 `tests/symphony-cli.test.js`：`adoptionJournalArtifactPath` 指向仓库 `README.md` 时必须返回 `403 blocked-artifact-path`，payload 通过 validator，响应体不包含 README 内容。
- 旧 scan fixture 的 `--output-dir` artifact 现在在 legacy preview route 返回 `403 blocked-artifact-path`，测试已改为断言不可预览，不再期待直接 inline project context JSON。

第三次修复后验证：

- `node --check src/symphony/console.js && node --check tests/symphony-cli.test.js && node --test tests/symphony-cli.test.js tests/workbench-route-smoke.test.js tests/safe-artifact-preview-contract.test.js`
  - 通过；64 个 tests，7 个 suites，64 pass，0 fail，duration `1363.171542ms`。
- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - 通过；全量测试 554 个 tests，91 个 suites，554 pass，0 fail，duration `2962.180292ms`。

第四次独立 reviewer 复审结果：`NEEDS_REVISION`

Reviewer 发现 hardlink 绕过：

- 已登记 artifact path 位于 allowlist 内，例如 `artifacts/summary.json`，但它是指向外部本地文件 inode 的硬链接。原实现的 `lstat()` 不会把它识别为 symlink，`realpath()` 仍留在 allowlist 路径内，后续 `open()` 可能读取外部文件内容。

第四次修复内容：

- `isBlockedArtifactPreviewTarget()` 在 `lstat()` 后检查 `metadata.isFile() && metadata.nlink > 1`。
- 多硬链接文件直接返回 `403 blocked-artifact-path`，不进入 `stat()` 或 `open()`。
- `tests/symphony-cli.test.js` 增加回归：已登记 `adoptionPlanArtifactPath` 指向 `artifacts/hardlink-summary.json`，该文件是 allowlist 内的硬链接，原始内容来自 allowlist 外 `outside-local.json`。preview route 必须返回 `403`，payload 通过 validator，响应体不包含 `outsideLocalSecret`。

第四次修复后验证：

- `node --check src/symphony/console.js && node --check tests/symphony-cli.test.js && node --test tests/symphony-cli.test.js tests/workbench-route-smoke.test.js tests/safe-artifact-preview-contract.test.js`
  - 通过；64 个 tests，7 个 suites，64 pass，0 fail，duration `1366.729291ms`。
- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - 通过；全量测试 554 个 tests，91 个 suites，554 pass，0 fail，duration `2940.919459ms`。

第五次独立 reviewer 复审结果：`APPROVED`

- Reviewer 未发现阻塞问题。
