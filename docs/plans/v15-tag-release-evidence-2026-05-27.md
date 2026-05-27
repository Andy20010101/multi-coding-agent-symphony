# v15 Tag Release Evidence

日期：2026-05-27

任务：v15 tag 发布前 documentation / evidence 更新

## 任务目标

本文件记录 `v15` tag 发布证据与发布前边界。本 worker / 文档准备阶段只准备 README 与 evidence 文档，不创建 tag、不 push、不 commit；后续 release 流程会由父 agent 在验证后完成提交、推送与 annotated `v15` tag 发布。

## 前置核对

- 当前分支：`codex/v15-tag-release`。
- `git status -sb` 输出：`## codex/v15-tag-release`，任务开始时工作区无文件 diff。
- `git tag --list 'v15'` 无输出，说明本地尚无 `v15` tag。
- `git ls-remote --tags origin refs/tags/v15` 无输出，说明远端 `origin` 尚无 `refs/tags/v15`。
- `git tag --list 'v*' --sort=-version:refname | head -20` 显示当前最新 tag 为 `v14`。
- `git log --oneline --decorate -8` 显示当前 HEAD 为 `64e2a62 Document v15 release bookkeeping status`，并与 `origin/main` / `main` 对齐。
- 已复核 README 当前发布状态和 installer 段落。
- 已复核：
  - `docs/plans/v15-release-bookkeeping-evidence-2026-05-27.md`
  - `docs/plans/v15-final-closure-evidence-2026-05-27.md`
  - `docs/plans/v15-task11-release-verification-evidence-2026-05-27.md`

## Release scope

`v15` 发布范围是 React/Vite read-only Workbench migration：

- React/Vite Workbench 作为本地 read-only / display-only / copy-only 状态面。
- `/workbench/` 服务 Workbench 构建产物，`/` 继续保留 legacy console HTML。
- Workbench 展示 summary、readiness、runs、latest run、timeline、artifact refs/list、adoption summary 与 grouped copy-only commands。
- Workbench 不提供浏览器写入、执行、retry、adopt/apply/confirm/rollback、delete、install、mutation、audit、model invocation 或任意本地文件读取能力。

关联 evidence：

- `docs/plans/v15-task11-release-verification-evidence-2026-05-27.md` 记录 release verification：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`、Workbench focused tests、`pnpm test:mutation:gate`、`pnpm audit --audit-level high` 通过。
- `docs/plans/v15-final-closure-evidence-2026-05-27.md` 记录 v15 Workbench React/Vite migration 已完成计划内 closure，剩余事项均为 backlog / v16 contract work。
- `docs/plans/v15-release-bookkeeping-evidence-2026-05-27.md` 记录 v15 tag 前 release bookkeeping 文档同步状态。

## Tag 操作计划

- 本任务开始时，本地与远端都没有 `v15` tag；当前最新 tag 是 `v14`。
- 本 worker / 文档准备阶段不创建 `v15` tag、不 push、不 commit。
- 父 agent 将在本文档通过验证后 commit 文档变更、push 分支 / `main`，并创建、推送 annotated `v15` tag。
- `v15` tag 应指向创建 tag 当时的 `main` HEAD。
- tag 创建后，应验证本地 tag 对象与远端 `refs/tags/v15` 均存在。

## README 更新

- Current Documents 增加 `docs/plans/v15-tag-release-evidence-2026-05-27.md` 链接。
- 发布状态更新为 tag release commit 适用表述：当前 released repository tag 为 `v15`。
- Installer 说明保留 `v8` stable installer baseline。
- Installer 说明将 latest tagged release 从 `v14` 更新为 `v15`，允许 `MCAS_INSTALL_REF=v15` 指向 `v15` tag。
- Installer 说明保留历史 `v7` 安装说明。

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
- 不新增浏览器写入、执行、retry、adopt、apply、confirm-adoption、rollback、delete、install、mutation、audit、model invocation、任意路径读取或任意文件读取能力。
- 不删除历史 evidence。
- worker / 文档准备阶段不创建 tag、不 push、不 commit；这些 release 操作保留给父 agent 在验证通过后的后续流程执行。

## 验证计划

发布前文档变更验证：

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- `git diff -- package.json pnpm-lock.yaml`
- `git diff --name-only`

tag 创建后验证：

- `git show v15 --no-patch`
- `git ls-remote --tags origin refs/tags/v15`

## 本 worker 验证记录

本 worker 完成文档编辑后执行：

- `git add -N docs/plans/v15-tag-release-evidence-2026-05-27.md`
- `git diff --check`
- `git diff -- package.json pnpm-lock.yaml`
- `git diff --name-only`

本 worker / 文档准备阶段不执行 tag 创建后的验证命令；该验证属于父 agent 创建并推送 annotated `v15` tag 后的 release closure。

## 父 agent pre-tag 验证记录

独立 reviewer approve 后，父 agent 在 `codex/v15-tag-release` 分支执行 release tag 前验证：

- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`538` tests / `88` suites，`538` pass，`0` fail，duration `3008.72425ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 `src/symphony/workbench-static/index.html`、CSS asset 与 JS asset；Node WASI experimental warning 为既有非阻塞 warning。
- `pnpm audit --audit-level high`：通过，退出码 `0`；仍记录 `1` 个 moderate vulnerability，未发现 high / critical vulnerability。
- `git diff --check`：通过，无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出，确认 release tag 文档阶段未改依赖清单或 lockfile。

## 结论

本文档是 `v15` tag 发布证据文档。任务开始时本地和远端都没有 `v15` tag，当前最新 tag 是 `v14`。

本 worker / 文档准备阶段只准备 tag release commit 所需的 README 与 evidence 文档。后续 release 流程应由父 agent 在验证通过后 commit 文档变更、push 分支 / `main`，并创建、推送指向当时 `main` HEAD 的 annotated `v15` tag。
