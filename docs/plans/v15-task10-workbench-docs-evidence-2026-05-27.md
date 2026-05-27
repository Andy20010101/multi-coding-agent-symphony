# v15 Task 10 Workbench 文档与操作指南 Evidence

日期：2026-05-27

## 任务目标

本任务补齐 v15 Workbench 的中文使用说明、操作边界、只读安全模型、开发/构建命令、故障排查和已知限制。范围只包含文档与 evidence，不做功能实现。

## 输入材料

- `tmp/codex-prompts/v15_goal_execution_plan.md` 中 Task 10。
- `docs/plans/v15-task8-workbench-static-serving-evidence-2026-05-27.md`。
- `docs/plans/v15-task9-workbench-route-smoke-evidence-2026-05-27.md`。
- `README.md`。
- `docs/symphony-product-contracts.md`。
- `docs/troubleshooting.md`。
- `package.json`。
- `scripts/symphony.js` console 参数解析。
- `src/symphony/console.js` route 与只读 server 行为。
- `frontend/workbench/vite.config.js`。
- `frontend/workbench/src/api/contracts.js`。

## 命令确认

从 `package.json` 确认：

- `pnpm workbench:build` 当前执行 `vite build --config frontend/workbench/vite.config.js`。
- `pnpm workbench:dev` 当前执行 `vite --host 127.0.0.1 --config frontend/workbench/vite.config.js`。
- `pnpm symphony console` 当前通过 `node scripts/symphony.js` 进入产品 CLI。

从 `scripts/symphony.js` 确认 console 当前支持：

- `--snapshot`
- `--json`
- `--state-dir <path>`
- `--host <host>`
- `--port <port>`

实际运行确认：

- `pnpm --silent symphony console --help`：失败，退出码 `64`，输出 `unknown console option: --help`。
- `pnpm --silent symphony --help`：失败，退出码 `64`，输出 `unknown command`。

因此本任务文档没有把 `--help` 写成当前支持的操作入口。

## 变更文件

- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v15-task10-workbench-docs-evidence-2026-05-27.md`

## 文档覆盖范围

新增 `docs/workbench-operator-guide.md`，覆盖：

- Workbench 当前定位：read-only / display-only / copy-only。
- 构建命令：`pnpm workbench:build`。
- 前端源码调试脚本：`pnpm workbench:dev`，并明确它不是完整 console server parity 验证入口。
- Console / Workbench 启动方式：`symphony console`、`pnpm symphony console`、默认 `127.0.0.1:8765`、React Workbench `/workbench/`。
- 当前已支持 console 参数：`--snapshot`、`--json`、`--state-dir`、`--host`、`--port`。
- 当前只读 API 列表与 non-GET `405` 边界。
- 禁止能力：write、execute、retry、adopt、apply、rollback、delete、install、mutation、audit、model invocation。
- Artifact preview gaps：`safeToRenderInline`、`mime`、`previewAvailable`、`artifactKind`、`sourceRunId`、`sizeBytes`、`displayTitle`、`uri`、`ref` 未暴露时不能由前端推断。
- Stage Charter HTML / JSON 不被 React 替换、不被 `/workbench` fallback 覆盖。
- 故障排查：缺少 build 产物、端口占用、no runs、Vite dev API 读取失败、`405`、artifact preview 字段缺失、Stage Charter 独立边界。
- 已知限制：只读展示、无 inline preview、无任意路径、无 mutation/audit/model invocation。

`README.md` 只做最小入口更新：

- 在 Current Documents 增加 Workbench Operator Guide 链接。
- 在 Development 检查命令中加入 `pnpm workbench:build`。
- 更新 `symphony console` 段落，说明 v15 React/Vite Workbench 位于 `/workbench/`，并补齐禁止能力与 artifact preview gap 提醒。

## 未修改范围

- 没有修改 `frontend/workbench/src/*`。
- 没有修改 `src/symphony/*`。
- 没有修改测试代码。
- 没有新增依赖。
- 没有修改 `package.json`。
- 没有修改 `pnpm-lock.yaml`。
- 没有新增命令或 script。
- 没有运行 `pnpm add`。
- 没有提交。
- 没有 push。

## 验证命令

```sh
pnpm check
pnpm test
pnpm workbench:build
git add -N docs/workbench-operator-guide.md docs/plans/v15-task10-workbench-docs-evidence-2026-05-27.md
git diff --check
git diff -- package.json pnpm-lock.yaml
```

## 验证结果

- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`538 tests`，`538 pass`，`0 fail`。
- `pnpm workbench:build`：通过，退出码 `0`。构建产物仍为：
  - `src/symphony/workbench-static/index.html`
  - `src/symphony/workbench-static/assets/index-J_tkNlVv.css`
  - `src/symphony/workbench-static/assets/index-nLv-wKCK.js`
  命令出现 Node WASI experimental warning，不影响退出码。
- `git add -N docs/workbench-operator-guide.md docs/plans/v15-task10-workbench-docs-evidence-2026-05-27.md`：通过，无输出，用于让新增文档进入 diff 审查。
- `git diff --check`：通过，无输出，覆盖 `README.md` 与两个新增文档。
- `git diff -- package.json pnpm-lock.yaml`：无输出，确认没有修改 `package.json` 或 `pnpm-lock.yaml`。

## parent 注意事项

- 本任务新增的是操作文档，不改变 Workbench 行为。
- 文档明确 `/` 仍是既有 console HTML，v15 React/Vite Workbench 入口是 `/workbench/`。
- 文档把 `pnpm workbench:dev` 限定为前端源码调试脚本，避免把它误写成完整 console API parity 验证入口。
- Artifact preview gap 仍是 contract gap；文档没有暗示前端可以从路径、扩展名或内容推断安全渲染能力。
