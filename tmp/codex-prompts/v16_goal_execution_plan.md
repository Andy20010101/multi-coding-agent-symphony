# v16 `/goal` 任务闭环执行计划

日期：2026-05-27
适用项目：`multi-coding-agents-symphony`
适用阶段：v16 Guided Goal Handoff + Safe Artifact Preview Contract
中文名：目标执行手册与安全产物预览层

---

## 0. 使用方式

1. 一次只复制一个 Task 的 `/goal` 块执行。
2. 不要让 `/goal` 一次连续完成多个 task。
3. 每个 task 必须完整闭环：从 `main` 同步；新建 task branch；执行；本地验证；独立 review；approved 后 commit；push；merge 回 `main`；在 `main` 上补跑验证。
4. worker 与 reviewer 必须上下文隔离。reviewer 只读 diff 并自己核对仓库事实，不依赖 worker 叙述。
5. writer / worker 自测只算 self-check，不算最终验收。
6. 如果 review 返回 `NEEDS_REVISION`，只修 blocker，不扩展到下一 task。

---

## 1. 全局要求

- 全部 prompt、evidence、review、closure 使用中文优先。
- 技术名词、contract name、字段名、命令、路径、commit message 可保留英文。
- 不新增英文版 summary。
- 不实现 v16 之外能力。
- 不新增浏览器执行面。
- 不让 Workbench 触发写入、模型、audit、mutation、安装或任意路径读取。
- 不新增浏览器 adopt / apply / retry / rollback。
- 不推断 artifact safe fields：`safeToRenderInline`、`previewAvailable`、`mime`、`artifactKind`、`sourceRunId`、`sizeBytes`、`displayTitle`、`uri/ref` 必须来自后端 contract。
- 不修改 v12 adoption safety boundary、v14 Stage boundary、v15 Workbench read-only boundary。
- 不删除历史 evidence。
- 默认不新增依赖，不修改 `package.json` / `pnpm-lock.yaml`；除非 task 明确是 approved dependency plan。

---

## 2. 当前状态

当前基线应为：

- 分支：从 `main` 派生的 v16 task 分支。
- 基线提交：`2c1b9b9 Prepare v15 tag release evidence`。
- 当前 release tag：`v15`。
- v15 已完成 React/Vite read-only Workbench migration。
- v16 计划文档：`docs/plans/v16-guided-goal-handoff-safe-artifact-preview-plan-2026-05-27.md`。

v16 建议 task：

| Task | 名称 | 核心目标 | Evidence |
|---|---|---|---|
| 1 | plan approval and baseline freeze | 冻结计划、边界、handoff schema 草案 | `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md` |
| 2 | handoff contract fixtures | fixture-backed handoff contract | `docs/plans/v16-task2-handoff-contract-fixtures-evidence-2026-05-27.md` |
| 3 | CLI handoff generation | CLI 生成 copy-only handoff | `docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md` |
| 4 | read-only API exposure | 只读暴露 handoff artifact | `docs/plans/v16-task4-readonly-handoff-api-evidence-2026-05-27.md` |
| 5 | Workbench handoff panel | 只读 handoff panel | `docs/plans/v16-task5-workbench-handoff-panel-evidence-2026-05-27.md` |
| 6 | safe artifact preview contract fixtures | 冻结安全预览 contract | `docs/plans/v16-task6-safe-preview-contract-fixtures-evidence-2026-05-27.md` |
| 7 | safe artifact preview implementation | 后端安全预览实现 | `docs/plans/v16-task7-safe-preview-implementation-evidence-2026-05-27.md` |
| 8 | Workbench preview consumption | 前端只读消费安全预览 | `docs/plans/v16-task8-workbench-preview-consumption-evidence-2026-05-27.md` |
| 9 | route smoke and security coverage | route smoke / security coverage | `docs/plans/v16-task9-route-smoke-security-evidence-2026-05-27.md` |
| 10 | docs and operator guide | 文档和操作说明 | `docs/plans/v16-task10-docs-operator-guide-evidence-2026-05-27.md` |
| 11 | release verification | 发布级验证 | `docs/plans/v16-task11-release-verification-evidence-2026-05-27.md` |
| 12 | closure | v16 closure | `docs/plans/v16-final-closure-evidence-2026-05-27.md` |

---

## 3. 通用 preflight

每个 task 开始前执行：

```bash
git checkout main
git pull
git status -sb
git log --oneline --decorate -8
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git diff -- package.json pnpm-lock.yaml
```

通过标准：

- `main` 与 `origin/main` 同步。
- 工作区干净。
- 最近提交链包含前一个 task。
- `pnpm check`、`pnpm test`、`pnpm workbench:build` 通过。
- `git diff --check` 无输出。
- 若 task 未批准依赖变化，`git diff -- package.json pnpm-lock.yaml` 无输出。

---

## 4. 通用 post-task 验收

worker 完成后先不要 commit，执行：

```bash
git status -sb
git diff --name-only
git diff --stat
git diff -- package.json pnpm-lock.yaml
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

新增文件先纳入 intent-to-add：

```bash
git add -N <新增文件路径>
git diff -- <新增文件路径>
```

通用安全扫描：

```bash
grep -RniE "<button|role=['\"]button|onClick|onSubmit|<form|<a\\s|href=" frontend/workbench/src src/symphony tests || true
grep -RniE "method\\s*:\\s*['\"](POST|PUT|PATCH|DELETE)|navigator\\.sendBeacon|WebSocket|EventSource|XMLHttpRequest" frontend/workbench/src src/symphony tests || true
grep -RniE "adopt|apply|retry|execute|rollback|delete|mutate|mutation|audit|model|install|采纳|应用|重试|执行|回滚|删除|审计|模型|安装" frontend/workbench/src src/symphony tests || true
grep -RniE "safeToRenderInline|previewAvailable|mime|artifactKind|sourceRunId|sizeBytes|displayTitle|uri|ref|previewText|contentText" frontend/workbench/src src/symphony tests || true
```

判断原则：

- 命中只读展示、禁止事项说明、字段 contract，可以接受。
- 命中浏览器执行控件、写入 API、任意路径读取、artifact safety 推断，需要 revision。

---

## 5. 独立 review gate 通用要求

每个 task 完成 worker self-check 后，启动独立 reviewer：

```text
/goal
你是 v16 Task X independent reviewer。上下文隔离，请不要依赖 worker 叙述。只读当前分支 diff、相关源码、测试、文档和计划文件，自己核对事实。

审查目标：
- 当前 task 是否只完成本 task 范围。
- 是否违反 v16 非目标和安全边界。
- 是否新增未批准依赖或 lockfile diff。
- 是否新增浏览器写入、执行、模型、audit、mutation、安装、adopt/apply/retry/rollback 或任意路径读取。
- 是否推断 artifact safe fields。
- evidence 是否中文、路径正确、验证真实。

输出：
- APPROVED，或
- NEEDS_REVISION，并列出 blocker、文件路径、建议修复范围。
```

reviewer `APPROVED` 后才允许 commit / push / merge。

---

## Task 1：plan approval and baseline freeze

## `/goal` 执行块

```text
/goal
执行 v16 Task 1：plan approval and baseline freeze。

目标：冻结 v16 Guided Goal Handoff + Safe Artifact Preview Contract 的计划、边界、review model、task 列表和基线。此任务只做文档/evidence，不实现功能。

前提：`docs/plans/v16-guided-goal-handoff-safe-artifact-preview-plan-2026-05-27.md`、`tmp/codex-prompts/v16_goal_execution_plan.md` 和 README 链接已由 v16 planning commit 加入 `main`。Task 1 不重新创建这些文件，只做 approval / baseline freeze evidence 和 reviewer 要求的必要文字修正。

从 main 开始：
1. git checkout main && git pull
2. 确认 git log --oneline --decorate -8 包含 v15 tag / 2c1b9b9 Prepare v15 tag release evidence。
3. 跑 pnpm check、pnpm test、pnpm workbench:build、git diff --check。
4. 创建分支：v16-task1-plan-approval。

实现范围：
- 核对 docs/plans/v16-guided-goal-handoff-safe-artifact-preview-plan-2026-05-27.md。
- 核对 tmp/codex-prompts/v16_goal_execution_plan.md 与 README 链接。
- 如有必要，只做 reviewer 要求的计划/prompt/README 文字修正。
- 新增中文 evidence：docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md。
- 记录 v15 tag 基线、非目标、安全边界、12 task 拆分、review model。

禁止事项：
- 不实现 v16 功能。
- 不新增依赖，不修改 package.json / pnpm-lock.yaml。
- 不改源码、测试、前端、server、kernel。
- 不新增浏览器执行面。
- 不修改 v12/v14/v15 safety boundary。
- 不删除历史 evidence。

验证：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml
- git diff --name-only

完成后不要自动 commit。输出中文总结：变更文件、基线确认、计划边界、验证结果、待 reviewer 核对点。
```

## review gate

review 必须确认：

- v16 plan 与 v15 closure / tag release evidence 一致。
- 非目标和安全边界清晰。
- 12 task 拆分完整。
- 没有功能、依赖、源码、测试改动。

## commit / push / merge

```bash
git add docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md
# 如 reviewer 要求修正文案，再额外 add 对应的 README / v16 plan / v16 goal prompt 文件。
git status --short
git diff --cached --name-only
git commit -m "Approve v16 guided handoff baseline"
git push -u origin v16-task1-plan-approval

git checkout main
git pull
git merge --ff-only v16-task1-plan-approval
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

完成状态：

```text
Task 1：approved / committed / pushed / merged to main
```

---

## Task 2：handoff contract fixtures

## `/goal` 执行块

```text
/goal
执行 v16 Task 2：handoff contract fixtures。

目标：为 Guided Goal Handoff 建立 fixture-backed contract。先冻结结构和测试，不接 Workbench，不实现执行能力。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 1 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task2-handoff-contract-fixtures。

实现范围：
- 新增或扩展 handoff contract fixtures，覆盖 goal、baseline、scope、nonGoals、safetyBoundaries、tasks、roles、commands、reviewModel、releaseGates、stopConditions。
- 增加 contract / fixture tests。
- 新增中文 evidence：docs/plans/v16-task2-handoff-contract-fixtures-evidence-2026-05-27.md。

禁止事项：
- 不接 Workbench。
- 不新增 API route。
- 不新增执行 endpoint。
- 不新增依赖/lockfile。
- 不新增浏览器执行面。
- 不推断 artifact safe fields。
- 不修改 v12/v14/v15 safety boundary。

验证：
- focused contract tests
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：contract 字段、fixtures、测试结果、安全边界。
```

## review gate

review 必须确认 contract 不包含执行入口，fixtures 覆盖 review / verifier / release evidence，并且没有新增依赖。

## commit / push / merge

```bash
git add <Task 2 实际变更文件>
git commit -m "Add v16 handoff contract fixtures"
git push -u origin v16-task2-handoff-contract-fixtures

git checkout main
git pull
git merge --ff-only v16-task2-handoff-contract-fixtures
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 3：CLI handoff generation

## `/goal` 执行块

```text
/goal
执行 v16 Task 3：CLI handoff generation。

目标：新增或扩展 CLI 生成 Guided Goal Handoff 文本/JSON 的能力。CLI 只生成 copy-only 手册，不执行命令、不调用模型、不自动创建分支/commit/push。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 2 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task3-cli-handoff-generation。

实现范围：
- 根据 Task 2 contract 生成稳定 handoff JSON/Markdown。
- 输出 preflight、task branch、local validation、review、commit、push、merge、main post-merge validation 的 copy-only commands。
- 增加 CLI tests / snapshots。
- 新增中文 evidence：docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md。

禁止事项：
- 不调用模型。
- 不执行 handoff 中的命令。
- 不创建分支、commit、push。
- 不写 arbitrary path。
- 不新增依赖/lockfile。
- 不新增浏览器执行面。
- 不修改 v12/v14/v15 safety boundary。

验证：
- focused CLI tests
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：CLI 行为、输出格式、验证结果、禁止能力确认。
```

## review gate

review 必须确认 CLI 是生成器，不是执行器；输出命令为 copy-only；没有未批准写入或依赖。

## commit / push / merge

```bash
git add <Task 3 实际变更文件>
git commit -m "Generate v16 guided handoff output"
git push -u origin v16-task3-cli-handoff-generation

git checkout main
git pull
git merge --ff-only v16-task3-cli-handoff-generation
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 4：read-only API exposure

## `/goal` 执行块

```text
/goal
执行 v16 Task 4：read-only API exposure。

目标：以只读 GET API 暴露 registered Guided Goal Handoff artifact，供 Workbench 展示。API 不接受任意路径，不执行命令。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 3 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task4-readonly-handoff-api。

实现范围：
- 新增或扩展只读 route，返回 handoff contract。
- 只允许读取 registered handoff refs。
- 非 GET 返回 405 / not allowed。
- 增加 API tests / route tests。
- 新增中文 evidence：docs/plans/v16-task4-readonly-handoff-api-evidence-2026-05-27.md。

禁止事项：
- 不新增 POST/PUT/PATCH/DELETE 写入路径。
- 不接受 arbitrary filesystem path。
- 不触发 worker、model、audit、mutation、install。
- 不新增浏览器执行面。
- 不新增依赖/lockfile。
- 不修改 v12/v14/v15 safety boundary。

验证：
- focused API tests
- non-GET blocked tests
- path traversal probes
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：route contract、只读边界、安全测试、验证结果。
```

## review gate

review 必须确认 route 只读、只返回 registered refs、非 GET 被拒绝、无任意路径读取。

## commit / push / merge

```bash
git add <Task 4 实际变更文件>
git commit -m "Expose v16 handoff through read-only API"
git push -u origin v16-task4-readonly-handoff-api

git checkout main
git pull
git merge --ff-only v16-task4-readonly-handoff-api
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 5：Workbench handoff panel

## `/goal` 执行块

```text
/goal
执行 v16 Task 5：Workbench handoff panel。

目标：在 Workbench 中只读展示 Guided Goal Handoff：phase、role、task、evidence、review gate、copy-only next commands。Workbench 仍然 display-only / copy-only。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 4 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task5-workbench-handoff-panel。

实现范围：
- 增加只读 handoff API binding。
- 增加 handoff panel 展示。
- 命令只能复制/选中，不执行。
- 缺失字段如实显示为未暴露或不可用。
- 增加前端 tests 或 focused build checks。
- 新增中文 evidence：docs/plans/v16-task5-workbench-handoff-panel-evidence-2026-05-27.md。

禁止事项：
- 不新增执行按钮、写入 handler、form submit。
- 不调用模型、audit、mutation、install。
- 不新增 adopt/apply/retry/rollback。
- 不合成 safety/capabilities 结论。
- 不新增依赖/lockfile。
- 不修改 v12/v14/v15 safety boundary。

验证：
- pnpm workbench:build
- pnpm check
- pnpm test
- grep handler / method / forbidden words scans
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：Workbench 展示范围、copy-only 边界、验证结果。
```

## review gate

review 必须确认 Workbench 没有执行控件，命令只是 copy-only 文本，前端没有伪造缺失 contract 字段。

## commit / push / merge

```bash
git add <Task 5 实际变更文件>
git commit -m "Add v16 workbench handoff panel"
git push -u origin v16-task5-workbench-handoff-panel

git checkout main
git pull
git merge --ff-only v16-task5-workbench-handoff-panel
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 6：safe artifact preview contract fixtures

## `/goal` 执行块

```text
/goal
执行 v16 Task 6：safe artifact preview contract fixtures。

目标：冻结 safe-artifact-preview.v1 contract fixtures 和 tests。先定义后端必须显式提供的安全字段，不实现前端预览。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 5 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task6-safe-preview-contract-fixtures。

实现范围：
- 定义 preview contract：ref、uri、mime、displayTitle、artifactKind、sourceRunId、sizeBytes、previewAvailable、safeToRenderInline、truncated、truncationReason、maxPreviewBytes、previewText/contentText。
- fixtures 覆盖 safe text、unsafe binary、unknown mime、oversize/truncated、missing safety fields。
- 增加 contract tests。
- 新增中文 evidence：docs/plans/v16-task6-safe-preview-contract-fixtures-evidence-2026-05-27.md。

禁止事项：
- 不实现 Workbench preview。
- 不从文件扩展名或路径在前端推断 safe fields。
- 不新增 arbitrary path preview。
- 不新增下载、执行或打开本地文件能力。
- 不新增依赖/lockfile。
- 不修改 v12/v14/v15 safety boundary。

验证：
- focused contract tests
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：contract 字段、fixtures、验证结果、风险。
```

## review gate

review 必须确认 preview safety 字段完整、缺字段场景覆盖、没有前端或 route 行为提前实现。

## commit / push / merge

```bash
git add <Task 6 实际变更文件>
git commit -m "Add v16 safe artifact preview fixtures"
git push -u origin v16-task6-safe-preview-contract-fixtures

git checkout main
git pull
git merge --ff-only v16-task6-safe-preview-contract-fixtures
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 7：safe artifact preview implementation

## `/goal` 执行块

```text
/goal
执行 v16 Task 7：safe artifact preview implementation。

目标：后端只对 registered artifacts 生成受限 safe preview。实现必须遵守 Task 6 contract，不允许任意路径读取或 unsafe inline render。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 6 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task7-safe-preview-implementation。

实现范围：
- 新增或扩展只读 preview route / snapshot builder。
- 只接受 registered artifact ref。
- 后端显式设置 mime、previewAvailable、safeToRenderInline、truncated 等字段。
- 大文件截断；HTML/script/binary 不 inline。
- 增加 route/security tests。
- 新增中文 evidence：docs/plans/v16-task7-safe-preview-implementation-evidence-2026-05-27.md。

禁止事项：
- 不接受 arbitrary filesystem path。
- 不暴露 package.json、pnpm-lock.yaml、src/*、docs/* 等本地任意文件。
- 不新增写入、下载、执行、model、audit、mutation。
- 不新增浏览器 adopt/apply/retry/rollback。
- 不新增依赖/lockfile，除非已有 approved dependency plan。
- 不修改 v12/v14/v15 safety boundary。

验证：
- focused preview tests
- path traversal probes
- non-GET blocked tests
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：preview 安全边界、route 行为、测试结果、延后事项。
```

## review gate

review 必须确认 preview 只读、只处理 registered artifacts、不读取任意路径、不 inline unsafe 内容。

## commit / push / merge

```bash
git add <Task 7 实际变更文件>
git commit -m "Implement v16 safe artifact previews"
git push -u origin v16-task7-safe-preview-implementation

git checkout main
git pull
git merge --ff-only v16-task7-safe-preview-implementation
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 8：Workbench preview consumption

## `/goal` 执行块

```text
/goal
执行 v16 Task 8：Workbench preview consumption。

目标：Workbench 只读消费 safe artifact preview contract，展示安全文本预览、不可预览原因、截断状态。前端不能推断任何 safety 字段。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 7 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task8-workbench-preview-consumption。

实现范围：
- 增加 preview API binding。
- 在 artifact 区域展示 previewAvailable / safeToRenderInline / mime / size / truncation。
- 仅当后端提供 safe inline text 时展示文本预览。
- raw HTML 必须按文本或不可预览处理，不作为 HTML 注入。
- 新增中文 evidence：docs/plans/v16-task8-workbench-preview-consumption-evidence-2026-05-27.md。

禁止事项：
- 不使用 dangerouslySetInnerHTML 或等价 HTML 注入。
- 不从 artifact kind、扩展名、路径推断 safeToRenderInline。
- 不新增下载/打开本地路径/执行按钮。
- 不新增 adopt/apply/retry/rollback。
- 不新增依赖/lockfile。
- 不修改 v12/v14/v15 safety boundary。

验证：
- pnpm workbench:build
- pnpm check
- pnpm test
- grep dangerouslySetInnerHTML / handler / method scans
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：预览展示规则、安全字段来源、验证结果。
```

## review gate

review 必须确认前端只消费后端字段，不推断、不注入 unsafe HTML、不新增执行面。

## commit / push / merge

```bash
git add <Task 8 实际变更文件>
git commit -m "Display v16 safe artifact previews"
git push -u origin v16-task8-workbench-preview-consumption

git checkout main
git pull
git merge --ff-only v16-task8-workbench-preview-consumption
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 9：route smoke and security coverage

## `/goal` 执行块

```text
/goal
执行 v16 Task 9：route smoke and security coverage。

目标：为 v16 handoff 和 safe preview route 增加真实 console server smoke/security 覆盖，证明只读、不可写、不可任意路径读取。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 8 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task9-route-smoke-security。

实现范围：
- 覆盖 handoff route GET 可读。
- 覆盖 preview route registered ref 可读。
- 覆盖非 GET 返回 405 / blocked。
- 覆盖 traversal 和 arbitrary path probes 被拒绝。
- 覆盖 Workbench route 不覆盖 API、Stage Charter、仓库文件。
- 新增中文 evidence：docs/plans/v16-task9-route-smoke-security-evidence-2026-05-27.md。

禁止事项：
- 不新增产品功能。
- 不新增依赖/lockfile。
- 不放宽 static serving root。
- 不新增浏览器执行面。
- 不修改 v12/v14/v15 safety boundary。

验证：
- focused route smoke tests
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：smoke 覆盖、安全 probes、验证结果。
```

## review gate

review 必须确认测试覆盖真实 server 行为，且没有为通过测试放宽安全边界。

## commit / push / merge

```bash
git add <Task 9 实际变更文件>
git commit -m "Add v16 route smoke security coverage"
git push -u origin v16-task9-route-smoke-security

git checkout main
git pull
git merge --ff-only v16-task9-route-smoke-security
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 10：docs and operator guide

## `/goal` 执行块

```text
/goal
执行 v16 Task 10：docs and operator guide。

目标：补齐 v16 Guided Goal Handoff 与 safe artifact preview 的中文使用说明、操作边界、故障排查和已知限制。此任务只做文档，不做功能。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 9 已在 main。
3. 跑通用 preflight。
4. 创建分支：v16-task10-docs-operator-guide。

实现范围：
- 更新 README Current Documents 或相关 docs。
- 更新 Workbench operator guide，说明 handoff panel、copy-only commands、safe preview。
- 说明 Workbench 仍为 read-only / display-only / copy-only。
- 说明 forbidden capabilities。
- 说明 artifact preview 缺字段时不可预览，前端不推断。
- 新增中文 evidence：docs/plans/v16-task10-docs-operator-guide-evidence-2026-05-27.md。

禁止事项：
- 不改源码、测试、server、kernel。
- 不新增依赖/lockfile。
- 不写未实现命令。
- 不改发布状态，除非 release task 明确要求。
- 不删除历史 evidence。

验证：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml

完成后不要自动 commit。输出中文总结：文档变更、能力边界、验证结果。
```

## review gate

review 必须确认文档与实现一致，没有夸大能力或暗示浏览器可执行。

## commit / push / merge

```bash
git add <Task 10 实际变更文件>
git commit -m "Document v16 handoff and preview boundaries"
git push -u origin v16-task10-docs-operator-guide

git checkout main
git pull
git merge --ff-only v16-task10-docs-operator-guide
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 11：release verification

## `/goal` 执行块

```text
/goal
执行 v16 Task 11：release verification。

目标：在 main 已包含 Task 1-10 后执行发布级验证并记录中文 release evidence。除非发现文档错误，否则不改功能。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 10 已在 main。
3. 创建分支：v16-task11-release-verification。

验证范围：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- focused handoff tests
- focused preview tests
- focused route smoke/security tests
- pnpm audit --audit-level high（如仓库策略保持）
- 安全扫描：写入 API、执行控件、arbitrary path、artifact safety 推断。
- 复查 package.json / pnpm-lock.yaml 是否只有 approved dependency plan 允许的变化。
- 复查 v12/v14/v15 safety boundary 未被 v16 越界修改。

新增中文 evidence：docs/plans/v16-task11-release-verification-evidence-2026-05-27.md。

禁止事项：
- 不新增功能。
- 不新增依赖/lockfile。
- 不修 audit，除非用户单独批准。
- 不把验证失败伪造成通过。
- 不创建 tag、不推送 release tag。

如果命令无法运行，必须在 evidence 中如实记录命令、失败原因、是否环境问题或真实 blocker。

完成后不要自动 commit。输出中文总结：验证命令、结果、失败/跳过原因、安全边界结论、release 风险。
```

## review gate

review 必须确认 release evidence 真实、失败未隐瞒、没有混入功能修改。

## commit / push / merge

```bash
git add docs/plans/v16-task11-release-verification-evidence-2026-05-27.md <其他确属 Task 11 的文件>
git commit -m "Add v16 release verification evidence"
git push -u origin v16-task11-release-verification

git checkout main
git pull
git merge --ff-only v16-task11-release-verification
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

---

## Task 12：closure

## `/goal` 执行块

```text
/goal
执行 v16 Task 12：closure。

目标：收尾 v16 Guided Goal Handoff + Safe Artifact Preview Contract，整理最终状态、task evidence、支持能力、明确不支持能力、遗留 backlog 和 tag review readiness。此任务只做 closure 文档。

从 main 开始：
1. git checkout main && git pull
2. 确认 Task 11 已在 main。
3. 跑 pnpm check、pnpm test、pnpm workbench:build、git diff --check。
4. 创建分支：v16-task12-closure。

实现范围：
- 新增中文 closure evidence：docs/plans/v16-final-closure-evidence-2026-05-27.md。
- 汇总 Task 1-11 提交、evidence、验证结果。
- 汇总当前支持的 handoff / preview 能力。
- 汇总明确不支持的能力。
- 汇总 diagnostics / capabilities / error envelope backlog。
- 记录是否 ready for v16 tag review。

禁止事项：
- 不做新功能。
- 不新增依赖/lockfile。
- 不改源码、测试、前端、server、kernel。
- 不创建 tag、不 push tag。
- 不删除历史 evidence。
- 不修改 v12/v14/v15 safety boundary。

验证：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- git diff -- package.json pnpm-lock.yaml
- git log --oneline -12

完成后不要自动 commit。输出中文总结：v16 完成范围、遗留事项、验证结果、是否 ready for release/tag review。
```

## review gate

review 必须确认 closure 准确反映实际代码和 evidence，没有把 backlog 写成已完成。

## commit / push / merge

```bash
git add docs/plans/v16-final-closure-evidence-2026-05-27.md <其他确属 Task 12 的文件>
git commit -m "Close v16 guided handoff evidence"
git push -u origin v16-task12-closure

git checkout main
git pull
git merge --ff-only v16-task12-closure
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git push origin main
```

完成状态：

```text
v16：ready for final release review / ready for tag release planning
```

---

## 6. 全局停止条件

任意 task 出现以下情况，立即停止并进入 revision：

- `pnpm check` 失败。
- `pnpm test` 失败。
- `pnpm workbench:build` 失败。
- `git diff --check` 有输出。
- 未批准新增依赖或 `pnpm-lock.yaml` diff。
- Workbench 出现写入、执行、模型、audit、mutation、安装、adopt/apply/retry/rollback 控件。
- API 出现未批准 POST/PUT/PATCH/DELETE 写入路径。
- route 接受 arbitrary path 或可读取仓库任意文件。
- frontend 推断 artifact safe fields。
- v12 adoption safety boundary、v14 Stage boundary、v15 Workbench read-only boundary 被无计划修改。
- evidence 缺失、不是中文、路径错误或删除历史 evidence。
- reviewer 返回 `NEEDS_REVISION`。

---

## 7. 每个 task 的最终状态格式

```text
Task X：approved / committed / pushed / merged to main
分支：v16-taskX-...
提交：<hash> <message>
Evidence：docs/plans/v16-taskX-...-evidence-2026-05-27.md
验证：pnpm check passed；pnpm test passed；pnpm workbench:build passed；git diff --check clean
安全：无未批准依赖；无浏览器执行面；无 arbitrary path；无 artifact safety 推断
主线：main / origin/main 已同步
下一步：ready for Task X+1 planning
```
