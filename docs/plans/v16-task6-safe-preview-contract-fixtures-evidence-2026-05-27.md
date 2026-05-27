# v16 Task 6 safe preview contract fixture 证据

日期：2026-05-27
分支：`v16-task6-safe-preview-contract-fixtures`
基线：`main` 已包含 `0f703de Add v16 workbench handoff panel`

## 范围

本任务只冻结 `safe-artifact-preview.v1` contract、fixtures 和 tests。没有实现 Workbench preview，没有新增 route，没有读取 artifact 文件，也没有新增下载、执行或打开本地文件能力。

## Preflight

从 `main` 开始：

- `git checkout main && git pull`：`Already up to date.`
- `git status -sb`：`## main...origin/main`
- `git log --oneline --decorate -8`：HEAD 为 `0f703de`，Task 5 已在 `main`。
- `git diff --check`：无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。

通用 preflight：

- `pnpm check && pnpm test && pnpm workbench:build`
  - `pnpm check`：通过。
  - `pnpm test`：547 个 tests，90 个 suites，547 pass，0 fail，duration `2942.818041ms`。
  - `pnpm workbench:build`：通过，输出仍为 `index-BNWPIsAg.js` 和 `index-BdBWycDT.css`。

之后创建分支：

- `git switch -c v16-task6-safe-preview-contract-fixtures`

## Contract 字段

新增 `src/symphony/safe-artifact-preview.js`，冻结：

- `contractName`: `safe-artifact-preview.v1`
- `contractVersion`: `1`
- `ref`: opaque registered artifact ref，不允许 path / traversal 语法。
- `uri`: 只允许 `/api/` 或 `symphony-preview:` 开头，不允许 `file:`、traversal 或反斜杠。
- `mime`
- `displayTitle`
- `artifactKind`: `project-context`、`intake-summary`、`patch-plan`、`evidence`、`handoff-contract`
- `sourceRunId`
- `sizeBytes`
- `previewAvailable`
- `safeToRenderInline`
- `truncated`
- `truncationReason`
- `maxPreviewBytes`
- `previewText` 或 `contentText`：只允许在 `previewAvailable === true` 且 `safeToRenderInline === true` 时出现。
- `downloadAvailable`: v16 contract 中必须为 `false`。

inline 预览安全约束：

- `safeToRenderInline === true` 时必须同时有 `previewAvailable === true`。
- `safeToRenderInline === true` 时 MIME 必须是 `text/*` 或 `application/json`。
- `previewText` 和 `contentText` 互斥。
- `truncated === true` 时必须有非空 `truncationReason`，且 `sizeBytes > maxPreviewBytes`。
- `sizeBytes > maxPreviewBytes` 时必须有 `truncated === true`。
- `truncated === false` 时 `truncationReason` 必须为 `null`。

## Fixtures

新增 fixtures：

- `fixtures/contracts/safe-artifact-preview.safe-text.v1.json`
  - safe text；`previewAvailable: true`，`safeToRenderInline: true`，`truncated: false`，使用 `previewText`。
- `fixtures/contracts/safe-artifact-preview.unsafe-binary.v1.json`
  - unsafe binary；`mime: application/octet-stream`，`previewAvailable: false`，`safeToRenderInline: false`，没有 preview text。
- `fixtures/contracts/safe-artifact-preview.unknown-mime.v1.json`
  - unknown MIME；`mime: application/x-unknown`，不可 inline render。
- `fixtures/contracts/safe-artifact-preview.oversize-truncated.v1.json`
  - oversize text；`sizeBytes: 350000`，`maxPreviewBytes: 1024`，`truncated: true`，`truncationReason: size-exceeds-max-preview-bytes`，使用 `contentText`。
- `fixtures/contracts/safe-artifact-preview.missing-safety-fields.invalid.v1.json`
  - invalid fixture；故意缺少 `previewAvailable`、`safeToRenderInline`、`truncated`、`truncationReason`、`maxPreviewBytes`、`downloadAvailable`。

## Tests

新增 `tests/safe-artifact-preview-contract.test.js`，覆盖：

- 所有合法 fixtures 都通过 `validateSafeArtifactPreviewContract()`。
- safe text、unsafe binary、unknown MIME、oversize/truncated 的语义被冻结。
- `ref` 不能是 path，`uri` 必须是受控 API/internal URI。
- missing safety fields fixture 必须失败。
- 禁止 unsafe inline content、download、local file URI、path-like ref。
- 截断字段和 safe inline MIME 约束必须显式满足。
- oversized preview 不能在 `truncated === false` 时通过。

## 本地验证

聚焦验证：

- `node --test tests/safe-artifact-preview-contract.test.js`
  - 6 个 tests，1 个 suite，6 pass，0 fail，duration `43.609ms`。
- `node --check src/symphony/safe-artifact-preview.js && node --check tests/safe-artifact-preview-contract.test.js`
  - 通过。

全量验证：

- `pnpm check && pnpm test && pnpm workbench:build`
  - `pnpm check`：通过。
  - `pnpm test`：553 个 tests，91 个 suites，553 pass，0 fail，duration `3013.857208ms`。
  - `pnpm workbench:build`：通过，输出仍为 `index-BNWPIsAg.js` 和 `index-BdBWycDT.css`。
- `git diff --check`
  - 无输出。
- `git diff -- package.json pnpm-lock.yaml`
  - 无输出。

边界扫描：

- `rg -n "safe-artifact-preview|safeArtifactPreview|SAFE_ARTIFACT" src/symphony/console.js scripts/symphony.js frontend/workbench/src`
  - 无输出，exit code 1。
- `rg -n "node:fs|readFile|writeFile|createReadStream|fetch\\(|XMLHttpRequest|WebSocket|spawn\\s*\\(|execFile\\s*\\(|execSync\\s*\\(|child_process" src/symphony/safe-artifact-preview.js fixtures/contracts/safe-artifact-preview*.json`
  - 无输出，exit code 1。
- `rg -n "downloadAvailable\\s*:\\s*true|\\\"downloadAvailable\\\"\\s*:\\s*true" src/symphony/safe-artifact-preview.js fixtures/contracts/safe-artifact-preview*.json tests/safe-artifact-preview-contract.test.js`
  - 无输出，exit code 1。
- `rg -n "<button\\b|<a\\s|href\\s*=|onClick|navigator\\.clipboard|safeToRenderInline\\s*:\\s*true|previewAvailable\\s*:\\s*true|artifactKind\\s*:\\s*artifact\\.kind" frontend/workbench/src`
  - 无输出，exit code 1。

## 保留限制

- 没有 Workbench preview UI。
- 没有后端 preview route。
- 没有 arbitrary path preview。
- 没有 download capability。
- 没有 dependency 或 lockfile 变更。
- 没有修改 v12/v14/v15 safety boundary。

## Reviewer gate

第一次独立 reviewer：`019e69ce-96be-7a53-9714-b0e2ee998f4c`

结果：`NEEDS_REVISION - oversized inline previews can pass without required truncation.`

Reviewer 发现 `sizeBytes > maxPreviewBytes` 且 `truncated === false` 的 preview 可以通过 validator。修复内容：

- `validateTruncation()` 新增规则：`sizeBytes > maxPreviewBytes` 时必须 `truncated === true`。
- `tests/safe-artifact-preview-contract.test.js` 新增反例：safe text clone 设置 `sizeBytes = maxPreviewBytes + 1` 且 `truncated === false` 时必须失败，错误为 `previews larger than maxPreviewBytes must be truncated`。

修复后验证：

- `node --test tests/safe-artifact-preview-contract.test.js && node --check src/symphony/safe-artifact-preview.js && node --check tests/safe-artifact-preview-contract.test.js`
  - 通过；聚焦测试 6 个 tests，1 个 suite，6 pass，0 fail，duration `40.984125ms`。
- `pnpm check && pnpm test && pnpm workbench:build`
  - 通过；全量测试 553 个 tests，91 个 suites，553 pass，0 fail，duration `3013.857208ms`。
- `git diff --check`
  - 无输出。
- `git diff -- package.json pnpm-lock.yaml`
  - 无输出。
- 本证据中的 4 条边界扫描重跑后仍无输出，exit code 1。

待 reviewer 对修复后的 diff 和证据重新给出 `APPROVED` 或 `NEEDS_REVISION`。

第二次独立 reviewer 复审结果：`APPROVED - no blocking findings.`

Reviewer 确认：

- oversized `truncated === false` preview 现在会按预期失败。
- focused safe preview tests 通过。
- syntax checks 通过。
- `git diff --check` clean。
- `git diff -- package.json pnpm-lock.yaml` empty。
- 边界扫描没有发现前端、route、script、download、read、write、execute surface 新增。
