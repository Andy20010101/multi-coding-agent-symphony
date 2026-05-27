# v15 Release Bookkeeping Evidence

日期：2026-05-27

任务：v15 后 release bookkeeping 第一步

## 任务范围

本任务只同步 README 发布状态说明和新增 release bookkeeping evidence。

本 bookkeeping scope 不创建或推送 `v15` tag；本 worker 阶段未 commit/push。本任务不修改功能代码、API contract、依赖、lockfile、前端、server、kernel 或测试。

## 前置核对

- 当前分支：`codex/v15-release-bookkeeping`。
- `git status -sb` 输出：`## codex/v15-release-bookkeeping`，任务开始时工作区无文件 diff。
- `git tag --list 'v*' --sort=-version:refname | head -20` 最新 tag 仍为 `v14`，后续依次包含 `v12`、`v11`、`v9.1`、`v9`、`v8.2`、`v8`、`v7`、`v6`、`v5`、`v4`、`v3`、`v2-beta`、`v2-alpha`。
- 任务开始时 `main` / `origin/main` 指向或包含 `fb92519 Close v15 workbench migration evidence`。
- 已复核 README 的 Current Documents、Current Status、installer 说明。
- 已复核：
  - `docs/plans/v15-final-closure-evidence-2026-05-27.md`
  - `docs/plans/v15-task11-release-verification-evidence-2026-05-27.md`
  - `docs/plans/v14-release-evidence-2026-05-26.md`

## 本任务变更文件

- `README.md`
- `docs/plans/v15-release-bookkeeping-evidence-2026-05-27.md`

## README 更新点

- Current Documents 新增 v15 release / closure / bookkeeping 相关链接：
  - `docs/plans/v15-task11-release-verification-evidence-2026-05-27.md`
  - `docs/plans/v15-final-closure-evidence-2026-05-27.md`
  - `docs/plans/v15-release-bookkeeping-evidence-2026-05-27.md`
- Current Status 修正过期的 release tag 表述：最新完成的 mainline milestone 是 `v15`，但当前 released repository tag 仍为 `v14`，直到 `v15` tag 被创建。
- Installer 说明修正 `MCAS_INSTALL_REF=v14` 的含义：`v14` 仍是 latest tagged release；v15 mainline closure 已完成，但 `MCAS_INSTALL_REF=v15` 只能在 `v15` tag 创建后使用。

## v15 closure / release verification 引用

- `docs/plans/v15-task11-release-verification-evidence-2026-05-27.md` 记录发布级验证通过：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`、Workbench focused tests、`pnpm test:mutation:gate`、`pnpm audit --audit-level high`。
- `docs/plans/v15-final-closure-evidence-2026-05-27.md` 记录 v15 Workbench React/Vite migration 已完成计划内 closure，并明确剩余事项属于 backlog / v16 contract work。
- 本 bookkeeping evidence 只记录 v15 tag 前的文档同步状态，不替代 tag 发布 evidence。

## Tag 状态

- 当前 tag 列表最新仍为 `v14`。
- 本 bookkeeping scope 未创建 `v15` tag。
- 本 bookkeeping scope 未 push `v15` tag。
- 本 worker 阶段未 commit/push。
- README 没有写成 `v15` tag 已存在。

## 安全边界

本任务确认并保持以下边界：

- 不改代码。
- 不改 API。
- 不改依赖。
- 不改 `package.json`。
- 不改 `pnpm-lock.yaml`。
- 不改源码、测试、前端、server 或 kernel。
- 不碰 v12 adoption safety kernel。
- 不碰 v14 Stage kernel / gate。
- 不新增浏览器写入、执行、retry、adopt、apply、rollback、delete、install、mutation、audit、model invocation、任意路径读取或任意文件读取能力。
- 不删除历史 evidence。

## 下一步

- 如用户确认发布，再执行 `v15` tag 创建 / push，并更新相应 tag release evidence。
- `v15` tag 创建后，installer 可使用 `MCAS_INSTALL_REF=v15` 指向该 tag。
- v16 规划可在 v15 tag 发布 bookkeeping 完成后开始，优先处理 v15 closure 记录的 artifact preview contract、diagnostics contract、error envelope、shared capabilities object 等 backlog。

## 结论

任务开始时，v15 mainline closure 已在 `main` / `origin/main` 上完成，`main` / `origin/main` 指向或包含 `fb92519 Close v15 workbench migration evidence`。

当前发布 tag 仍停留在 `v14`；本 bookkeeping scope 只完成 tag 前 release bookkeeping 文档同步，没有创建、推送或声明 `v15` tag 已发布。
