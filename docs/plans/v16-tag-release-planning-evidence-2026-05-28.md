# v16 tag release planning 证据

日期：2026-05-28
分支：`v16-tag-release-planning`
基线：`main` / `origin/main` 已包含 `f1e00cf Add v16 final release review evidence`

## 任务范围

本任务只进入 v16 tag release planning。当前阶段不创建 tag、不 push tag、不更新 released tag 状态，不修改源码、测试、Workbench 前端、console server、kernel、`package.json` 或 `pnpm-lock.yaml`。

本文件记录 tag release 的候选 tag、目标 commit 规则、前置 gate、README 更新范围、tag 操作命令、tag 后验证和停止条件。

## 前置核对

- 当前 `main` / `origin/main`：`f1e00cf Add v16 final release review evidence`。
- `docs/plans/v16-final-release-review-evidence-2026-05-28.md` 记录 final release review 结果为 `APPROVED`。
- `docs/plans/v16-final-closure-evidence-2026-05-27.md` 记录 v16 状态为 `ready for final release review / ready for tag release planning`。
- Task 1 reviewer gate 已在 `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md` 补录，结果 `APPROVED`。
- `git tag --list 'v16'`：无输出，本地没有 `v16` tag。
- `git ls-remote --tags origin refs/tags/v16`：无输出，远端没有 `refs/tags/v16`。
- `git tag --list 'v*' --sort=-version:refname | head -20`：当前最新 tag 为 `v15`。

## Release scope

`v16` 发布范围：

- `guided-goal-handoff.v1` contract、fixture、CLI JSON / Markdown 输出和 copy-only command blocks。
- `GET /api/handoff` 与 `GET /api/handoff/guided-goal-handoff.v1` 只读 registered handoff refs。
- Workbench guided handoff 面板只读展示 goal、baseline、roles、tasks、evidence path、review gate 和 copy-only commands。
- `safe-artifact-preview.v1` contract、fixtures、validator 和后端 safe preview route。
- `GET /api/runs/<run-id>/artifacts/<artifact-kind>/preview` 只读取 registered artifact refs，阻断 arbitrary path、traversal、repo package / lockfile、`src/*`、`docs/*`、symlink、多硬链接和 allowlist 外真实路径。
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

## Tag 目标

候选 tag：`v16`

Tag 类型：annotated tag。

Tag message：

```text
v16 guided handoff safe artifact preview release
```

当前 planning 基线是 `f1e00cf`。真正创建 `v16` tag 时，tag 应指向 tag release commit 当时的 `main` HEAD。该 commit 应包含：

- `docs/plans/v16-tag-release-evidence-2026-05-28.md`
- README release 状态从 `v15` 更新为 `v16`
- installer 文案中 latest tagged release 从 `MCAS_INSTALL_REF=v15` 更新为 `MCAS_INSTALL_REF=v16`

本 planning commit 不应被直接标记为 `v16`，除非后续决定不再新增 tag release evidence 或 README release 状态更新。

## Tag release 执行计划

1. 从 `main` 开始：

```bash
git checkout main
git pull --ff-only
git status -sb
git tag --list 'v16'
git ls-remote --tags origin refs/tags/v16
```

通过标准：

- `main` 与 `origin/main` 同步。
- 工作区干净。
- 本地和远端都没有 `v16` tag。

2. 创建 tag release 分支：

```bash
git switch -c v16-tag-release
```

3. 更新文档：

- 新增 `docs/plans/v16-tag-release-evidence-2026-05-28.md`。
- README Current Documents 增加 v16 tag release evidence 链接。
- README Current Status 更新：
  - Latest completed mainline milestone：`v16`
  - Current released repository tag：`v16`
  - 说明 v16 完成 guided handoff 与 safe artifact preview release。
- README installer 段落更新：
  - `MCAS_INSTALL_REF=v16` 指向 latest tagged release。
  - 保留 `v8` stable installer baseline 和历史 `v7` 说明。

4. Tag 前验证：

```bash
pnpm check
pnpm test
pnpm workbench:build
pnpm audit --audit-level high
git diff --check
git diff -- package.json pnpm-lock.yaml
git diff --stat v15..HEAD -- package.json pnpm-lock.yaml
```

通过标准：

- `pnpm check` 通过。
- `pnpm test` 通过。
- `pnpm workbench:build` 通过。
- `pnpm audit --audit-level high` exit code 0；如果仍只有 1 个 moderate vulnerability，按当前 high gate 不阻塞。
- `git diff --check` 无输出。
- `package.json` / `pnpm-lock.yaml` 无 v16 diff。

5. 安全边界扫描：

```bash
rg -n "dangerouslySetInnerHTML|innerHTML|insertAdjacentHTML|DOMParser|<iframe|srcdoc|onClick|onSubmit|addEventListener\\s*\\(|<button\\b|role\\s*=\\s*[\\\"']button[\\\"']|<a\\s|href\\s*=|<form\\b|<input\\b|<select\\b|<textarea\\b|navigator\\.clipboard|localStorage|indexedDB" frontend/workbench/src || true
rg -n "method\\s*:\\s*['\\\"](POST|PUT|PATCH|DELETE)['\\\"]|fetch\\([^\\n]*(POST|PUT|PATCH|DELETE)|handle(Execute|Retry|Apply|Adopt|Rollback|Delete|Install|Mutate|Audit)|dangerouslySetInnerHTML" frontend/workbench/src tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js || true
rg -n "safeToRenderInline\\s*:\\s*true|previewAvailable\\s*:\\s*true|artifactKind\\s*:\\s*artifact\\.kind|/artifacts/\\$\\{|/artifacts/'\\s*\\+|extname|artifact\\.path[\\s\\S]{0,80}\\.endsWith|\\.endsWith\\s*\\(\\s*['\\\"]\\.(html|json|txt)|\\.includes\\s*\\(\\s*['\\\"]\\.html" frontend/workbench/src || true
```

通过标准：

- Workbench 源码无 HTML 注入、浏览器执行控件、写入控件、clipboard / storage 控件。
- Workbench 源码无 POST / PUT / PATCH / DELETE 请求。
- Workbench 源码无前端 preview safety 推断。
- 测试中的负向断言命中需要在 evidence 中逐条记录。

6. Commit、push、merge：

```bash
git add README.md docs/plans/v16-tag-release-evidence-2026-05-28.md
git commit -m "Prepare v16 tag release evidence"
git push -u origin v16-tag-release

git checkout main
git pull --ff-only
git merge --ff-only v16-tag-release
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

7. 创建并推送 annotated tag：

```bash
git tag -a v16 -m "v16 guided handoff safe artifact preview release"
git push origin v16
```

8. Tag 后验证：

```bash
git show v16 --no-patch
git ls-remote --tags origin refs/tags/v16
git status -sb
```

通过标准：

- 本地 `v16` tag 指向 tag release commit 的 `main` HEAD。
- 远端 `refs/tags/v16` 存在。
- `main` / `origin/main` 同步。
- 工作区干净。

## 停止条件

任一条件出现时停止 tag release：

- 本地或远端已有 `v16` tag，但目标 commit 与计划不一致。
- `main` 与 `origin/main` 不同步。
- 工作区不干净且改动不是当前 tag release 任务产生。
- `pnpm check`、`pnpm test` 或 `pnpm workbench:build` 失败。
- `pnpm audit --audit-level high` 失败，或出现 high / critical vulnerability。
- `git diff --check` 有输出。
- `package.json` / `pnpm-lock.yaml` 出现未计划 diff。
- Workbench 源码新增执行、写入、模型、audit、mutation、install、adopt / apply / retry / rollback / delete 控件。
- API 或 preview route 接受 arbitrary path 或 traversal。
- 前端推断 safe preview fields。
- README release 状态没有在 tag release commit 中更新为 `v16`。
- tag 后验证无法确认本地和远端 `v16` tag。

## Planning 验证结果

本 planning 任务完成后已执行：

```bash
pnpm check && pnpm test && pnpm workbench:build && pnpm audit --audit-level high && git diff --check && git diff -- package.json pnpm-lock.yaml && git tag --list 'v16' && git ls-remote --tags origin refs/tags/v16
```

结果：

- `pnpm check`：通过。
- `pnpm test`：通过，91 suites、557 tests，0 failed，duration `3186.5645ms`。
- `pnpm workbench:build`：通过，生成 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
- `pnpm audit --audit-level high`：exit code 0；输出 `1 vulnerabilities found`，severity 为 `1 moderate`，未触发 high gate。
- `git diff --check`：无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。
- `git tag --list 'v16'`：无输出，本地仍没有 `v16` tag。
- `git ls-remote --tags origin refs/tags/v16`：无输出，远端仍没有 `refs/tags/v16`。

## 当前结论

v16 已通过 final release review，可以进入 tag release 执行阶段。当前 planning 阶段不创建 tag；下一步应按本文件的执行计划准备 `v16-tag-release` 分支、更新 README release 状态、写入 tag release evidence，并在验证通过后创建和推送 annotated `v16` tag。
