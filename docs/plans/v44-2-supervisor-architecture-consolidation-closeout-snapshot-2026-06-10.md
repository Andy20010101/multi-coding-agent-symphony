# v44.2 Supervisor Architecture Consolidation 收口快照

日期：2026-06-10

仓库：`Andy20010101/multi-coding-agent-symphony`

核对基线：`origin/main`，提交 `ad871a3045f6ac2de8676241469682f8c3d800ef`

这份快照记录 PR-4 迟到合并后的 v44.2 收口状态。PR-5 release policy 和 PR-6 handoff metadata 已经先进入 `main`，PR-4 后合并到当前 `origin/main`。本文档不改变运行时行为。

## PR 合并记录

| PR | 工作包 | 分支 | Merge commit |
| --- | --- | --- | --- |
| #11 | PR-0 runbook | `codex/v44-2-supervisor-consolidation-runbook` | `9d9bb99c64e38a97a7a119455b3b1c4f0f1ad8c3` |
| #12 | PR-CI 文档变更的 mutation gate 策略 | `codex/v44-2-ci-gates-docs-only` | `7675a7100f610d03020a1362d0c9189a23a1dd4c` |
| #13 | PR-1 supervisor state vocabulary | `codex/v44-2-pr1-supervisor-state-vocabulary` | `c0c54acd24f4fd0143b29b3a10b40414eb518291` |
| #14 | PR-2 recorded result intake projection | `codex/v44-2-pr2-recorded-result-intake-projection` | `bf50c5a1ab18584dd9cb4f01ccb668b14913e0b9` |
| #15 | PR-3 route/progress projection surface | `codex/v44-2-pr3-route-progress-projection-surface` | `d3589e192e84ba82fbec03577233ff32216587bc` |
| #16 | PR-5 release policy model | `codex/v44-2-pr5-release-policy-model` | `e178026f0653e7de3af873f8f6f8a220063c587f` |
| #17 | PR-6 core projection handoff metadata | `codex/v44-2-pr6-core-projection-handoff-metadata` | `f73ca29b0bbbf18d4b3f4ca2d24f7259c57568a9` |
| #18 | late PR-4 registration preview writer | `codex/v44-2-pr4-registration-preview-writer` | `ad871a3045f6ac2de8676241469682f8c3d800ef` |

本地 first-parent 历史与上表一致。#18 在 #17 之后合并，是本次核对时的 `origin/main` 头部提交。

## Late PR-4 核对

#18 相对 #17 只改了这些文件：

- `src/symphony/goal-supervisor/event-registrar.js`
- `src/symphony/goal-supervisor/state-writer.js`
- `tests/v44-goal-supervisor-state-writer-event-registrar.test.js`

#18 没有修改 `src/symphony/goal-supervisor/release-policy.js`。`event-registrar.js` 继续使用 release policy 拥有的函数：

- `evaluateReleaseRegistrarCloseoutAuthorization`
- `identifyReleaseGateForResult`
- `isReleaseManagerGateEvent`
- `normalizeReleaseGates`

`state-writer.js` 仍是 dry-run registration preview 包装层。预览输出继续保留 `readOnly: true`、`willMutate: false`、`dryRunOnly: true`、`writesInPreview: false`、`confirmExecutorAvailable: false`、`liveManagedGoalAppendIntroduced: false`。

#18 没有修改 `src/symphony/goal-supervisor/core-projection-handoff-metadata.js`。handoff descriptor 仍把这些面留在 v44.2 仓库拥有行为之外：

- `live-managed-goal-event-append-confirmation`
- `tag-push-publish-release-automation`
- `github-release-automation`
- `release-closeout-execution-automation`

## 验证命令

以下命令在 `/Users/andy/Documents/project/multi-coding-agent-symphony` 执行。执行顺序是在 `git fetch origin main` 之后、创建本文档分支之前。

| 命令 | 结果 |
| --- | --- |
| `git fetch origin main` | 退出码 0。`HEAD` 和 `origin/main` 都解析到 `ad871a3045f6ac2de8676241469682f8c3d800ef`。 |
| `node --test tests/v44-goal-supervisor-state-writer-event-registrar.test.js tests/v44-goal-supervisor-result-protocol.test.js tests/v44-goal-supervisor-route-progress.test.js tests/v44-goal-supervisor-core-projection.test.js` | 退出码 0。27 个测试通过，0 个失败。 |
| `pnpm check` | 退出码 0。source、scripts、plugin replay 文件和 tests 的 Node 语法检查通过。 |
| `git diff --check` | 退出码 0。没有 whitespace 错误。 |

未运行 mutation gate、audit command、provider CLI、real CLI、daemon、child process supervisor run、tag、publish、GitHub Release、release closeout automation。

## 边界声明

v44.2 按 repository-owned supervisor architecture consolidation 收口：

- 临时外部 runner 仍是 `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`；
- 仓库代码拥有 read-only vocabulary、projection、dry-run registration preview、release policy decision、handoff metadata；
- release-manager closeout 仍在没有显式 closeout authorization 时阻断；
- tag、push、publish、GitHub Release、provider CLI、daemon、PTY、browser terminal automation、real CLI execution、generic shell execution、live managed-goal append execution 仍不在 v44.2 范围内。

这份快照没有添加 runtime code、release automation、tag、GitHub Release、publish step 或 branch cleanup。

## 剩余风险和下一步

剩余风险是范围混淆，不是验证失败。当前代码已有仓库拥有的 projection model，但 runtime ownership 仍在外部。任何从 metadata/projection 进入 live execution 的工作，都需要单独计划、单独 PR，并重新与临时 runner 对比。

v44.2 实施分支可以在后续单独清理。本次快照没有做分支清理。

不要把本文档当作 v44.3 入口、frontend implementation approval、release closeout automation approval 或 publish approval。
