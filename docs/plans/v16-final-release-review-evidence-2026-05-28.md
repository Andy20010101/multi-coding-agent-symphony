# v16 final release review 证据

日期：2026-05-28
分支：`v16-final-release-review`
基线：`main` / `origin/main` 已包含 `c1742f8 Complete v16 task1 reviewer evidence`

## Review 结论

结果：`APPROVED`

v16 可以进入 tag release planning。此 review 没有创建 tag，没有推送 tag，也没有修改功能代码。

## 阻塞项

未发现 release blocker。

## 保留风险

- `pnpm audit --audit-level high` 通过；audit metadata 仍显示 `1` 个 moderate vulnerability。
- 当前 release gate 使用 high 阈值，因此该 moderate 项不阻塞 v16 release review。
- 如果 tag release policy 临时提高到 moderate 阈值，需要先单独处理该 audit backlog，再重新执行 audit 和 release review。

## Evidence 核对

已核对 v16 evidence 链：

- `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md`
- `docs/plans/v16-task2-handoff-contract-fixtures-evidence-2026-05-27.md`
- `docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md`
- `docs/plans/v16-task4-readonly-handoff-api-evidence-2026-05-27.md`
- `docs/plans/v16-task5-workbench-handoff-panel-evidence-2026-05-27.md`
- `docs/plans/v16-task6-safe-preview-contract-fixtures-evidence-2026-05-27.md`
- `docs/plans/v16-task7-safe-preview-implementation-evidence-2026-05-27.md`
- `docs/plans/v16-task8-workbench-preview-consumption-evidence-2026-05-27.md`
- `docs/plans/v16-task9-route-smoke-security-evidence-2026-05-27.md`
- `docs/plans/v16-task10-docs-operator-guide-evidence-2026-05-27.md`
- `docs/plans/v16-task11-release-verification-evidence-2026-05-27.md`
- `docs/plans/v16-final-closure-evidence-2026-05-27.md`

核对结果：

- Task 1-11 均已合入 `main`。
- Task 1 reviewer gate 已在 2026-05-28 补录，结果 `APPROVED`。
- Task 2-11 evidence 均记录 `APPROVED` reviewer gate。
- Task 12 closure 已记录 Task 1-11 evidence 状态、当前支持能力、明确不支持能力和 backlog。
- closure 当前结论为 `v16：ready for final release review / ready for tag release planning`。

## 当前支持能力

Handoff：

- `guided-goal-handoff.v1` contract 由 fixture 固定。
- `symphony handoff` 只输出 JSON 或 Markdown，不执行命令、不写文件、不调用模型。
- `GET /api/handoff` 和 `GET /api/handoff/guided-goal-handoff.v1` 只暴露 registered handoff refs。
- Workbench 只读展示 handoff 信息和 copy-only command blocks。

Safe artifact preview：

- `safe-artifact-preview.v1` contract 由后端生成。
- Preview route 只读取 run state 中 registered artifact refs。
- 后端阻断 query path、traversal、repo package / lockfile、`src/*`、`docs/*`、symlink、多硬链接和 allowlist 外真实路径。
- Workbench 只从后端 `artifact.uri` 创建 preview route，不根据 path、kind、扩展名、MIME 或内容片段推断 safety。
- Workbench 只在后端明确返回 `previewAvailable === true`、`safeToRenderInline === true` 且有 bounded text 时展示 `<pre><code>` 正文。

## 明确不支持能力

v16 release review 确认以下能力不在 v16 中发布：

- Autopilot。
- 浏览器执行 handoff command。
- Workbench adopt / apply / retry / rollback / delete / install / audit / model invocation / mutation。
- Workbench 写 state、写文件、创建分支、commit、push、merge。
- API 或前端任意路径读取。
- artifact download、open local file、`file:` URI。
- raw HTML / SVG / JavaScript / binary inline 渲染。
- 前端推断 `safeToRenderInline`、`previewAvailable`、MIME、artifact kind、size 或 preview route。
- 用 React fallback 替换 Stage Charter HTML / JSON。

## 验证结果

执行命令：

```bash
pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml
```

结果：

- `pnpm check`：通过。
- `pnpm test`：557 个 tests，91 个 suites，557 pass，0 fail，duration `3128.464167ms`。
- `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
- `git diff --check`：无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。

Audit：

```bash
pnpm audit --audit-level high
pnpm audit --json --audit-level high
```

结果：

- `pnpm audit --audit-level high`：exit code 0；输出 `1 vulnerabilities found`，`Severity: 1 moderate`。
- JSON metadata：`moderate: 1`，`high: 0`，`critical: 0`，`totalDependencies: 222`。

Package / lockfile：

```bash
git diff --stat v15..HEAD -- package.json pnpm-lock.yaml
git diff v15..HEAD -- src/symphony/adoption-inspect.js src/symphony/stage.js
```

结果：

- `package.json` / `pnpm-lock.yaml`：无 v16 diff。
- v12 adoption inspect / v14 Stage boundary 文件：无 v16 diff。

## 安全扫描

Workbench 源码控件 / HTML 注入扫描：

```bash
rg -n "dangerouslySetInnerHTML|innerHTML|insertAdjacentHTML|DOMParser|<iframe|srcdoc|onClick|onSubmit|addEventListener\\s*\\(|<button\\b|role\\s*=\\s*[\\\"']button[\\\"']|<a\\s|href\\s*=|<form\\b|<input\\b|<select\\b|<textarea\\b|navigator\\.clipboard|localStorage|indexedDB" frontend/workbench/src || true
```

结果：无输出。

写入 / mutation 扫描：

```bash
rg -n "method\\s*:\\s*['\\\"](POST|PUT|PATCH|DELETE)['\\\"]|fetch\\([^\\n]*(POST|PUT|PATCH|DELETE)|handle(Execute|Retry|Apply|Adopt|Rollback|Delete|Install|Mutate|Audit)|dangerouslySetInnerHTML" frontend/workbench/src tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js || true
```

结果：

- 只命中 `tests/workbench-shell.test.js:108` 的 `dangerouslySetInnerHTML` 负向断言。
- 只命中 `tests/workbench-shell.test.js:192` 的 `/workbench/` POST 拒绝用例。
- 未命中 Workbench 源码。

前端 safety 推断扫描：

```bash
rg -n "safeToRenderInline\\s*:\\s*true|previewAvailable\\s*:\\s*true|artifactKind\\s*:\\s*artifact\\.kind|/artifacts/\\$\\{|/artifacts/'\\s*\\+|extname|artifact\\.path[\\s\\S]{0,80}\\.endsWith|\\.endsWith\\s*\\(\\s*['\\\"]\\.(html|json|txt)|\\.includes\\s*\\(\\s*['\\\"]\\.html" frontend/workbench/src || true
```

结果：无输出。

## Backlog

以下 backlog 不阻塞当前 high-gate release review：

- `diagnostics.v1` 独立 contract。
- `capabilities.v1` 顶层 capability 对象。
- `error-envelope.v1` route 错误包络统一。
- 1 个 moderate audit finding。

## Tag release planning 入口

可以进入 v16 tag release planning。tag 步骤需要单独执行，并在 tag evidence 中记录：

- tag 名称和目标 commit。
- tag 创建 / 推送命令。
- tag 后验证结果。
- README release 状态是否从 v15 更新为 v16。
