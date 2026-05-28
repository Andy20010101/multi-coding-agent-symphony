# v17 tag release 证据

日期：2026-05-28
工作树：`main`
起点：`main` / `origin/main` 已包含 `11bf41b Support real CLI provider model routing`

## 任务范围

本任务创建并推送 annotated `v17` tag。变更范围只包括 README 发布状态和本 evidence 文件。

本 tag 指向当前 `main` HEAD。该 HEAD 包含：

- `56266e6 Implement v17 console progress contracts`
- `11bf41b Support real CLI provider model routing`

v17 原始计划范围是 read-only goal progress ledger 和 console contract hardening。`11bf41b` 是 tag 前已经合入并推送到 `main` 的 real CLI provider/model routing 改动，因此也包含在 `v17` tag 指向的代码状态里。

## 前置核对

- `git status -sb`：`## main...origin/main`，执行开始时工作区干净。
- `git tag --list 'v17*'`：无输出，本地没有 `v17` tag。
- `git ls-remote --tags origin 'refs/tags/v17*'`：无输出，远端没有 `refs/tags/v17*`。
- 当前主线 HEAD：`11bf41ba430942ea269f91dbbdbfebe4bf45d4cf`。

## Release scope

`v17` 发布范围：

- `goal-progress-ledger.v1` contract、fixtures、validator、resolver、CLI human / JSON / Markdown 输出。
- `symphony goal-status` 和 `symphony progress` 只读命令。
- `GET /api/goals`、`GET /api/goals/latest/progress`、`GET /api/goals/<goal-id>/progress`。
- `capabilities.v1`、`diagnostics.v1`、`error-envelope.v1` contract、fixtures、API route 和 Workbench 展示。
- Workbench Goal Progress、Capabilities、Diagnostics 面板。
- Workbench 和 API 继续保持 read-only / display-only / copy-only，不新增浏览器执行、写 state、下载、任意路径 preview、模型调用或 mutation 控件。
- Claude Code release provider preflight 支持通过 `ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic` 识别 DeepSeek provider。
- Kiro CLI 支持显式 profile 通过 `kiro-cli chat --model <model>` 传入，默认 `claude-kiro-default` 继续交给 Kiro CLI 自己选择模型。
- Kiro evidence parser 支持从包含多个 JSON 对象的 stdout 中提取最后的 balanced evidence JSON。

## Release 不包含

`v17` tag 不发布以下能力：

- Workbench 写 state、写文件、创建分支、commit、push、merge。
- Workbench 执行 copy-only command、retry、adopt、apply、rollback、delete、install、audit、mutation 或 model invocation。
- artifact download、open local file、`file:` URI。
- API 或前端任意路径读取。
- 前端根据 task id、branch、commit、命令文本、文件名或路径推断 goal status。
- 无 evidence 的 task 自动升级为 approved、main-verified 或 release-ready。

## README 更新

- Current Documents 增加 `docs/plans/v17-tag-release-evidence-2026-05-28.md` 链接。
- Current Status 更新为当前 released repository tag：`v17`。
- Installer latest tagged release 从 `MCAS_INSTALL_REF=v16` 更新为 `MCAS_INSTALL_REF=v17`。

## Pre-tag 验证

本 evidence 和 README 更新后执行：

```bash
pnpm check
pnpm test
pnpm workbench:build
pnpm audit --audit-level high
git diff --check
```

结果：

- `pnpm check`：通过。
- `pnpm test`：通过，95 suites、573 tests，573 pass、0 fail，duration `3334.789042ms`。
- `pnpm workbench:build`：通过，输出 `index-BTVrZKfX.css` 和 `index-ByQvKJF_.js`。
- `pnpm audit --audit-level high`：exit code 0；输出 `1 vulnerabilities found`，severity 为 `1 moderate`，未触发 high gate。
- `git diff --check`：无输出。

## Tag 操作

验证通过后已执行：

```bash
git push origin main
git tag -a v17 -m "v17 read-only goal progress console contracts release"
git push origin v17
```

结果：

- `git push origin main`：成功，`11bf41b..04a86f5  main -> main`。
- `git tag -a v17 -m "v17 read-only goal progress console contracts release"`：成功。
- `git push origin v17`：成功，远端新增 `v17` tag。

## Tag 后验证

tag 创建并推送后已执行：

```bash
git show v17 --no-patch --decorate
git ls-remote --tags origin refs/tags/v17 refs/tags/v17^{}
git status -sb
```

结果：

- `git show v17 --no-patch --decorate` 显示 annotated tag `v17`，tag message 为 `v17 read-only goal progress console contracts release`。
- `v17` 指向 commit `04a86f58af4f0e09c7b19364d22fcfa6ebbeb2c3`。
- 远端 tag 对象：`12fd279cb25c729c28f0eec912006d2356d76c8d refs/tags/v17`。
- 远端 peeled commit：`04a86f58af4f0e09c7b19364d22fcfa6ebbeb2c3 refs/tags/v17^{}`。
- `git status -sb`：`## main...origin/main`，tag 后工作区干净。

## Post-tag evidence 收尾

本节是在 `v17` tag 已创建并推送后补录的 release bookkeeping。它只更新本 evidence 文件，记录 tag 操作和 tag 后验证结果。

本次收尾不移动已推送的 `v17` tag。`v17` 继续指向 `04a86f58af4f0e09c7b19364d22fcfa6ebbeb2c3`。如果后续要求 tag 自身包含这次 post-tag evidence 收尾，需要单独决定是否重打 tag。

## 当前结论

`v17` annotated tag 已创建并推送到远端。README 已更新为当前 released repository tag：`v17`。Pre-tag 验证、tag 操作和 tag 后验证均已记录。
