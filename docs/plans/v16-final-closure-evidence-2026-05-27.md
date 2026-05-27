# v16 final closure 证据

日期：2026-05-27
分支：`v16-task12-closure`
基线：`main` / `origin/main` 已包含 `115cf94 Add v16 release verification evidence`

## 收尾范围

本任务只新增本 closure evidence。没有新增功能，没有修改源码、测试、Workbench 前端、console server、kernel、`package.json` 或 `pnpm-lock.yaml`，没有创建 tag，也没有推送 release tag。

Task 12 的作用是把 v16 已完成内容、当前可用能力、明确不支持能力、遗留 backlog 和发布复核状态放到一个证据文件中，供后续 release review 或 tag release planning 使用。

## Task 1-11 合入索引

| Task | 提交 | Evidence | 结果 |
| --- | --- | --- | --- |
| 1 plan approval and baseline freeze | `3410509 Approve v16 guided handoff baseline` | `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md` | 已合入 `main`；该 evidence 记录 worker self-check 和待 reviewer 核对点，但没有落盘最终 `APPROVED` reviewer gate |
| 2 handoff contract fixtures | `fb6930a Add v16 handoff contract fixtures` | `docs/plans/v16-task2-handoff-contract-fixtures-evidence-2026-05-27.md` | `APPROVED`，已合入 `main` |
| 3 CLI handoff generation | `12180b2 Generate v16 guided handoff output` | `docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md` | 修正 evidence 扫描记录后 `APPROVED`，已合入 `main` |
| 4 read-only handoff API | `5403cb2 Expose v16 handoff through read-only API` | `docs/plans/v16-task4-readonly-handoff-api-evidence-2026-05-27.md` | 修正 evidence diff stat 后 `APPROVED`，已合入 `main` |
| 5 Workbench handoff panel | `0f703de Add v16 workbench handoff panel` | `docs/plans/v16-task5-workbench-handoff-panel-evidence-2026-05-27.md` | `APPROVED`，已合入 `main` |
| 6 safe preview contract fixtures | `2b1cd19 Add v16 safe artifact preview fixtures` | `docs/plans/v16-task6-safe-preview-contract-fixtures-evidence-2026-05-27.md` | 修正 oversized truncation 规则后 `APPROVED`，已合入 `main` |
| 7 safe preview implementation | `7704fb6 Implement v16 safe artifact previews` | `docs/plans/v16-task7-safe-preview-implementation-evidence-2026-05-27.md` | 修正 registered repo file、symlink、README 和 hardlink 绕过后 `APPROVED`，已合入 `main` |
| 8 Workbench preview consumption | `f56b1fa Display v16 safe artifact previews` | `docs/plans/v16-task8-workbench-preview-consumption-evidence-2026-05-27.md` | `APPROVED`，已合入 `main` |
| 9 route smoke and security coverage | `6a5a96d Add v16 route smoke security coverage` | `docs/plans/v16-task9-route-smoke-security-evidence-2026-05-27.md` | `APPROVED`，已合入 `main` |
| 10 docs and operator guide | `4131864 Document v16 handoff and preview boundaries` | `docs/plans/v16-task10-docs-operator-guide-evidence-2026-05-27.md` | `APPROVED`，已合入 `main` |
| 11 release verification | `115cf94 Add v16 release verification evidence` | `docs/plans/v16-task11-release-verification-evidence-2026-05-27.md` | `APPROVED`，已合入并推送 `main` |

## Task 1-11 验证汇总

各 task 的 evidence 都记录了对应分支上的 `pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check` 和 package / lockfile diff 结果。Task 11 在 `main` 合入前做了发布级复核：

- `pnpm check`：通过。
- `pnpm test`：557 个 tests，91 个 suites，557 pass，0 fail，duration `2986.30875ms`。
- `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
- `git diff --check`：无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。
- `pnpm audit --audit-level high`：exit code 0；保留 1 个 moderate vulnerability，未在 v16 中自动修复。

Task 11 合入 `main` 后再次执行主线验证：

- `pnpm check && pnpm test && pnpm workbench:build && git diff --check`
  - `pnpm check`：通过。
  - `pnpm test`：557 个 tests，91 个 suites，557 pass，0 fail，duration `3032.609167ms`。
  - `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
  - `git diff --check`：无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。

## 当前支持的 handoff 能力

`guided-goal-handoff.v1` 已经固定为 fixture-backed contract。当前支持内容：

- `fixtures/contracts/guided-goal-handoff.v1.json` 记录 v16 goal、baseline、scope、non-goals、safety boundaries、roles、12 个 tasks、copy-only commands、review model、release gates、stop conditions 和 deferred contracts。
- `symphony handoff`、`symphony handoff --json`、`symphony handoff --markdown` 只把固定 contract 输出到 stdout，不执行命令，不写文件，不调用模型，不创建分支或提交。
- `GET /api/handoff` 返回 registered handoff refs index。
- `GET /api/handoff/guided-goal-handoff.v1` 返回固定 handoff contract；未知 ref、query path 和 traversal probe 被拒绝。
- Workbench 读取 registered ref 后展示 goal、baseline、roles、tasks、evidence path、review gate 和 copy-only command blocks。
- Workbench command blocks 是可选中文本，没有 copy button、execute button、form、link、clipboard 调用或 action handler。
- Contract 没有暴露的 task `phase` / `status`，Workbench 显示缺失状态，不从其他字段推断。

## 当前支持的 safe preview 能力

`safe-artifact-preview.v1` 已经固定为后端判断、前端只读消费的 contract。当前支持内容：

- Contract 字段包括 `ref`、`uri`、`mime`、`displayTitle`、`artifactKind`、`sourceRunId`、`sizeBytes`、`previewAvailable`、`safeToRenderInline`、`truncated`、`truncationReason`、`maxPreviewBytes`、`downloadAvailable`，以及互斥的 `previewText` / `contentText`。
- `downloadAvailable` 在 v16 中必须为 `false`。
- 后端 canonical route 为 `GET /api/runs/<run-id>/artifacts/<artifact-kind>/preview`，只读取 run state 中已登记的 artifact ref。
- 后端只允许读取 `stateDir` 内部或 `stateDir` 同级 `artifacts/` 下的 registered artifact path，并阻断 repo `package.json`、lockfile、`src/*`、`docs/*`、symlink、多硬链接和 allowlist 外真实路径。
- 后端 safe text preview 上限为 200 KiB；超限时返回 `truncated: true` 和 `truncationReason: size-exceeds-max-preview-bytes`。
- HTML、JavaScript、SVG、binary、directory、missing、blocked、未知 MIME 或缺安全字段 payload 不会作为正文 inline。
- Workbench 只从后端 `artifact.uri` 创建 preview route，不从 artifact kind、path、扩展名、MIME 或内容片段推断安全性。
- Workbench 只有在后端 payload 明确满足 `previewAvailable === true`、`safeToRenderInline === true` 且提供 `contentText` 或 `previewText` 时，才在 `<pre><code>` 中显示 bounded text。
- Route smoke 覆盖 registered safe preview 200、HTML 不 inline、blocked repo file 403、non-GET 405、query path / traversal 400、未注册 kind 404，以及 `/workbench/api/*` 和 `/workbench/docs/stages/*` 不被 React fallback 误覆盖。

## 明确不支持的能力

v16 当前不支持以下能力：

- 不支持 Autopilot。
- 不支持浏览器里执行 handoff command。
- 不支持 Workbench adopt、apply、retry、rollback、delete、install、audit、model invocation 或 mutation。
- 不支持 Workbench 写 state、写文件、创建分支、commit、push、merge。
- 不支持从 API query、path 参数或前端输入读取任意本地文件。
- 不支持 artifact download、open local file 或暴露 `file:` URI。
- 不支持 raw HTML、SVG、JavaScript 或 binary inline 渲染。
- 不支持前端推断 `safeToRenderInline`、`previewAvailable`、MIME、artifact kind、size 或 preview route。
- 不替换 Stage Charter HTML / JSON，不把 `/workbench/docs/stages/*` 交给 React fallback。
- 不修改 v12 adoption safety boundary、v14 Stage kernel / gate、v15 Workbench read-only boundary。
- Task 12 不创建 release tag，不 push tag。

## Backlog

以下内容仍是 backlog，不计入 v16 已完成功能：

- Task 1 reviewer gate 记录缺口：`docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md` 没有记录最终 `APPROVED`。当前 closure 不把该项写成已完成 reviewer gate。
- `diagnostics.v1`：需要独立 contract、route、测试和 evidence，不能从 v16 handoff 或 safe preview 顺手实现。
- `capabilities.v1`：需要统一顶层 capability 对象，明确 read-only / display-only / copy-only / mutation 不可用状态。
- `error-envelope.v1`：需要统一 route error envelope，避免各 route 自行组织错误 payload。
- `pnpm audit --audit-level high` 已通过，但仍有 1 个 moderate vulnerability；v16 release verification 没有修复该项。
- v16 tag release planning 需要单独执行。Task 12 只记录 ready 状态，不创建 tag。

## Task 12 验证结果

本 closure evidence 写入后已执行：

- `git status -sb && git diff --name-only && git diff --stat`
  - 当前分支：`v16-task12-closure`。
  - 当前 diff 只有 `docs/plans/v16-final-closure-evidence-2026-05-27.md`。
- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml && git log --oneline -12`
  - `pnpm check`：通过。
  - `pnpm test`：557 个 tests，91 个 suites，557 pass，0 fail，duration `3020.558375ms`。
  - `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。
  - `git log --oneline -12` 输出：

```text
115cf94 Add v16 release verification evidence
4131864 Document v16 handoff and preview boundaries
6a5a96d Add v16 route smoke security coverage
f56b1fa Display v16 safe artifact previews
7704fb6 Implement v16 safe artifact previews
2b1cd19 Add v16 safe artifact preview fixtures
0f703de Add v16 workbench handoff panel
5403cb2 Expose v16 handoff through read-only API
12180b2 Generate v16 guided handoff output
fb6930a Add v16 handoff contract fixtures
3410509 Approve v16 guided handoff baseline
14c9c93 Add v16 guided handoff planning
```

## 独立 reviewer gate

独立 reviewer：`019e69c1-c54a-7fc0-8bff-57bcbd1c1b22`

首次结果：`NEEDS_REVISION`

reviewer 指出：

- closure table 把 Task 1 写成 `APPROVED`，但 `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md` 只记录到“待独立 reviewer 核对”，没有最终 `APPROVED` reviewer gate。
- closure conclusion 因此过度声明 Task 1-11 均已通过 reviewer gate。

修正内容：

- Task 1 table 改为已合入 `main`，但 reviewer gate 未在 Task 1 evidence 中落盘。
- Backlog 增加 Task 1 reviewer gate 记录缺口。
- 当前结论改为 Task 2-11 evidence 已记录 `APPROVED`，Task 1 证据缺口需要在 release review / tag planning 前处理。
- tag planning 状态改为有条件，不再写成无条件 ready。

复审结果：`APPROVED`

复审确认：

- 本 closure 准确反映 Task 1-11 commits、evidence 和验证结果，包括 Task 1 reviewer gate 未在 evidence 中落盘的缺口。
- 当前支持能力没有超出代码实际实现。
- backlog 没有被写成已完成能力。
- Task 12 diff 只新增本 evidence 文件，没有功能、依赖、源码、测试、前端、server 或 kernel 改动。
- 没有 tag 或 release tag 操作。

## 当前结论

Task 1-11 均已 commit、push 并合入 `main`；Task 2-11 evidence 已记录 `APPROVED` reviewer gate。Task 1 evidence 未记录最终 reviewer gate，是 release review / tag planning 前需要处理的证据缺口。

Task 12 验证和 reviewer gate 已通过。v16 代码与文档状态可以进入 final release review；tag release planning 需要先处理 Task 1 reviewer gate 记录缺口。

`v16：ready for final release review；ready for tag release planning 需先补齐 Task 1 reviewer gate 记录。`
