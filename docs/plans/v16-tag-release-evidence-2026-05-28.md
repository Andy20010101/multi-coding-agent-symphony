# v16 tag release 证据

日期：2026-05-28
分支：`v16-tag-release`
起点：`main` / `origin/main` 已包含 `50a5227 Plan v16 tag release`

## 任务范围

本任务按 `docs/plans/v16-tag-release-planning-evidence-2026-05-28.md` 执行 v16 tag release。变更范围只包括 README 发布状态和本 evidence 文件。

本任务不修改源码、测试、Workbench 前端、console server、kernel、`package.json` 或 `pnpm-lock.yaml`。

## 前置核对

- `git status -sb`：`## main...origin/main`，执行开始时工作区干净。
- `git branch --show-current`：`main`。
- `git log --oneline --decorate -5` 显示当前主线 HEAD 为 `50a5227 Plan v16 tag release`。
- `git tag --list 'v16'`：无输出，本地没有 `v16` tag。
- `git ls-remote --tags origin refs/tags/v16`：无输出，远端没有 `refs/tags/v16`。
- 已创建 release 执行分支：`v16-tag-release`。

## Release scope

`v16` 发布范围：

- `guided-goal-handoff.v1` contract、fixture、CLI JSON / Markdown 输出和 copy-only command blocks。
- `GET /api/handoff` 与 `GET /api/handoff/guided-goal-handoff.v1` 只读 registered handoff refs。
- Workbench guided handoff 面板只读展示 goal、baseline、roles、tasks、evidence path、review gate 和 copy-only commands。
- `safe-artifact-preview.v1` contract、fixtures、validator 和后端 safe preview route。
- `GET /api/runs/<run-id>/artifacts/<artifact-kind>/preview` 只读取 registered artifact refs。
- Preview route 阻断 arbitrary path、traversal、repo package / lockfile、`src/*`、`docs/*`、symlink、多硬链接和 allowlist 外真实路径。
- Workbench safe preview 只消费后端 `artifact.uri` 和后端安全字段，不做前端 safety 推断，不渲染 raw HTML。
- Route smoke 覆盖 handoff / preview / Workbench fallback / Stage Charter 边界。
- README 和 Workbench Operator Guide 已记录 v16 handoff / preview 边界。

## Release 不包含

`v16` tag 不发布以下能力：

- Autopilot。
- 浏览器执行 handoff command。
- Workbench adopt / apply / retry / rollback / delete / install / audit / model invocation / mutation。
- Workbench 写 state、写文件、创建分支、commit、push、merge。
- API 或前端任意路径读取。
- artifact download、open local file、`file:` URI。
- raw HTML / SVG / JavaScript / binary inline 渲染。
- 前端推断 `safeToRenderInline`、`previewAvailable`、MIME、artifact kind、size 或 preview route。
- 用 React fallback 替换 Stage Charter HTML / JSON。
- `diagnostics.v1`、`capabilities.v1`、`error-envelope.v1`。

## README 更新

- Current Documents 增加 `docs/plans/v16-tag-release-evidence-2026-05-28.md` 链接。
- Latest completed mainline milestone 更新为 `v16`。
- Current released repository tag 更新为 `v16`。
- Current Status 增加 v16 guided handoff 和 safe artifact preview contracts 的发布说明。
- Installer latest tagged release 从 `MCAS_INSTALL_REF=v15` 更新为 `MCAS_INSTALL_REF=v16`。
- 保留 `v8` stable installer baseline 和历史 `v7` 说明。

## Tag 目标

Tag：`v16`

Tag 类型：annotated tag。

Tag message：

```text
v16 guided handoff safe artifact preview release
```

`v16` tag 应指向合并本 release evidence commit 后的 `main` HEAD。

## Pre-tag 验证

本分支完成 README 与 evidence 更新后执行：

```bash
pnpm check && pnpm test && pnpm workbench:build && pnpm audit --audit-level high && git diff --check && git diff -- package.json pnpm-lock.yaml && git diff --stat v15..HEAD -- package.json pnpm-lock.yaml
```

结果：

- `pnpm check`：通过。
- `pnpm test`：通过，91 suites、557 tests，557 pass、0 fail，duration `3067.489834ms`。
- `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
- `pnpm audit --audit-level high`：exit code 0；输出 `1 vulnerabilities found`，severity 为 `1 moderate`，未触发 high gate。
- `git diff --check`：无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。
- `git diff --stat v15..HEAD -- package.json pnpm-lock.yaml`：无输出。

## 安全边界扫描

本分支完成 README 与 evidence 更新后执行：

```bash
rg -n "dangerouslySetInnerHTML|innerHTML|insertAdjacentHTML|DOMParser|<iframe|srcdoc|onClick|onSubmit|addEventListener\\s*\\(|<button\\b|role\\s*=\\s*[\\\"']button[\\\"']|<a\\s|href\\s*=|<form\\b|<input\\b|<select\\b|<textarea\\b|navigator\\.clipboard|localStorage|indexedDB" frontend/workbench/src || true
rg -n "method\\s*:\\s*['\\\"](POST|PUT|PATCH|DELETE)['\\\"]|fetch\\([^\\n]*(POST|PUT|PATCH|DELETE)|handle(Execute|Retry|Apply|Adopt|Rollback|Delete|Install|Mutate|Audit)|dangerouslySetInnerHTML" frontend/workbench/src tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js || true
rg -n "safeToRenderInline\\s*:\\s*true|previewAvailable\\s*:\\s*true|artifactKind\\s*:\\s*artifact\\.kind|/artifacts/\\$\\{|/artifacts/'\\s*\\+|extname|artifact\\.path[\\s\\S]{0,80}\\.endsWith|\\.endsWith\\s*\\(\\s*['\\\"]\\.(html|json|txt)|\\.includes\\s*\\(\\s*['\\\"]\\.html" frontend/workbench/src || true
```

结果：

- Workbench 源码控件 / HTML 注入扫描：无输出。
- 写入 / mutation 扫描：只命中测试负向断言：
  - `tests/workbench-shell.test.js:108`：`dangerouslySetInnerHTML` 不存在断言。
  - `tests/workbench-shell.test.js:192`：`/workbench/` POST 拒绝用例。
- 写入 / mutation 扫描未命中 Workbench 源码。
- 前端 safety 推断扫描：无输出。

## Tag 操作

验证通过后执行：

```bash
git checkout main
git pull --ff-only
git merge --ff-only v16-tag-release
git push origin main
git tag -a v16 -m "v16 guided handoff safe artifact preview release"
git push origin v16
```

## Tag 后验证

tag 创建并推送后执行：

```bash
git show v16 --no-patch
git ls-remote --tags origin refs/tags/v16
git status -sb
```

## 当前结论

当前分支的 README 和 evidence 更新已通过 pre-tag 验证。下一步是提交本分支、快进合并到 `main`、推送 `main`，然后创建并推送 annotated `v16` tag。
