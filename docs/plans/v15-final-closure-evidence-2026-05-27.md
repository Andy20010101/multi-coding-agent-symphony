# v15 Final Closure Evidence

日期：2026-05-27

任务：v15 Task 12 closure and cleanup

## 任务目标

本文件收尾 v15 Workbench React/Vite migration，整理 Task 1-11 的提交、evidence、验证结果、当前支持能力、明确不支持能力、deferred contract gaps 与后续 v16 / backlog 建议。

本任务只新增最终 closure evidence，不做新功能、不修改 API contract、不新增依赖、不删除历史 evidence、不修改 v12 / v14 kernel、gate、ArtifactStore、verifier、policy、workspace manager 或 bridge。

## 前置核对

- 当前分支：`v15-task12-closure`。
- `git log --oneline -12` 显示 Task 11 已在当前分支历史中：`9c8dd46 Add v15 release verification evidence`。
- 读取并核对了：
  - `tmp/codex-prompts/v15_goal_execution_plan.md` 的 Task 12。
  - `docs/plans/v15-workbench-react-vite-migration-implementation-plan-2026-05-26.md` 的 v15 目标、边界、reviewer / release gate。
  - `README.md` 的 `symphony console` / v15 Workbench 当前说明。
  - `docs/workbench-operator-guide.md` 的操作边界与已知限制。
  - Task 1-11 现有 v15 evidence 文件。

## 本任务变更文件

- `docs/plans/v15-final-closure-evidence-2026-05-27.md`

本任务未修改 `README.md`、`docs/workbench-operator-guide.md`、`package.json`、`pnpm-lock.yaml`、前端源码、测试代码、console server 或核心 kernel 文件。

## Task 12 本次验证结果

- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`538` tests / `88` suites，`538` pass，`0` fail，duration `2908.747584ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 `src/symphony/workbench-static/index.html`、CSS asset 与 JS asset；Node WASI experimental warning 为既有非阻塞 warning。
- `git diff --check`：通过，无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出，确认 Task 12 未改依赖清单或 lockfile。
- `git log --oneline -12`：通过，最近 12 个提交包含 v15 implementation plan、Task 1-11，最新提交为 `9c8dd46 Add v15 release verification evidence`。

## Task 1-11 索引

| Task | 提交 | Evidence | 结果摘要 |
| --- | --- | --- | --- |
| Task 1 API fixture freeze | `3f70c2c Add v15 API fixture freeze` | `docs/plans/v15-task1-api-fixtures-evidence-2026-05-27.md` | 冻结 summary、readiness、runs、latest、timeline、artifact、adoption inspect 等 fixture-backed route contract；记录 artifact preview、capabilities、error envelope、diagnostics 等 deferred gaps。`node --test tests/symphony-cli.test.js`、`pnpm check`、`pnpm test`、`git diff --check` 通过。 |
| Task 2 React/Vite dependency plan | `b06e6e8 Add v15 Task 2 React Vite dependency plan` | `docs/plans/v15-task2-react-vite-dependency-plan-2026-05-27.md` | 只写 dependency plan，不安装依赖；限定后续 direct dependency 为 `react`、`react-dom`、`vite`、`@vitejs/plugin-react`，排除 UI framework、TypeScript、browser tooling 等未批准依赖。 |
| Task 3 React/Vite dependencies | `d0047b6 Add v15 React Vite dependencies` | `docs/plans/v15-task3-react-vite-dependency-evidence-2026-05-27.md` | 受控修改 `package.json` / `pnpm-lock.yaml`，引入 Task 2 批准的四个 direct dependencies；不实现 UI、不新增 scripts、不改 console。记录 audit / test / diff 结果。 |
| Task 4 React/Vite shell | `0a3b1e4 Add v15 React Vite workbench shell` | `docs/plans/v15-task4-react-vite-shell-evidence-2026-05-27.md` | 新增最小 React/Vite shell、`workbench:build` / `workbench:dev` scripts、收紧 Vite `server.fs.allow`；无 API binding、无执行控件。`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check` 通过。 |
| Task 5 read-only API binding | `112d2a3 Add read-only Workbench API binding` | `docs/plans/v15-task5-readonly-api-binding-evidence-2026-05-27.md` | 新增只读 frontend API client，绑定 `/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest`；只使用 GET，不伪造缺失字段。`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check` 通过。 |
| Task 6 read-only panels | `f21dc30 Add v15 read-only workbench panels` | `docs/plans/v15-task6-readonly-workbench-panels-evidence-2026-05-27.md` | 增加 Summary、Readiness、Runs、Latest Run、Route、Contract Gap 只读 panels；不新增依赖、不改 API contract、不实现 preview 或 adoption action。`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check` 通过。 |
| Task 7 timeline / artifacts / adoption summary | `7d19632 Add v15 read-only timeline and artifact views` | `docs/plans/v15-task7-readonly-timeline-artifacts-evidence-2026-05-27.md` | 增加 latest run timeline、artifact refs/list、adoption summary 只读展示；timeline run id 只来自 latest run contract 并经过 `encodeURIComponent`。`pnpm check`、`pnpm test`、`pnpm workbench:build`、安全扫描、`git diff --check` 通过。 |
| Task 8 static serving | `6ca00c7 Serve v15 workbench static assets` | `docs/plans/v15-task8-workbench-static-serving-evidence-2026-05-27.md` | Console server 只读服务 `/workbench` 静态产物，static root 固定为 `src/symphony/workbench-static/`；API、Stage Charter、非 Workbench route 不被 fallback 覆盖；path traversal 被拒绝。`pnpm check`、`pnpm test`、`pnpm workbench:build`、`node --test tests/workbench-shell.test.js`、`git diff --check` 通过。 |
| Task 9 route smoke / server parity | `3e908a0 Add v15 workbench route smoke coverage` | `docs/plans/v15-task9-workbench-route-smoke-evidence-2026-05-27.md` | 增加真实 console server route smoke，覆盖 `/workbench`、assets、fallback/404、API GET parity、non-GET 405、state 不写入、本地文件访问防护。`node --test tests/workbench-route-smoke.test.js`、`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check` 通过。 |
| Task 10 docs / operator guide | `368b500 Document v15 workbench operation boundaries` | `docs/plans/v15-task10-workbench-docs-evidence-2026-05-27.md` | 更新 README，新增中文 Workbench operator guide，记录构建、启动、只读 API、禁止能力、artifact preview gap、Stage Charter 边界与故障排查。`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check` 通过。 |
| Task 11 release verification | `9c8dd46 Add v15 release verification evidence` | `docs/plans/v15-task11-release-verification-evidence-2026-05-27.md` | 发布级验证通过：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`、Workbench focused tests、`pnpm test:mutation:gate`、`pnpm audit --audit-level high`。确认无 Workbench 写入/执行控件、static serving 不暴露任意本地文件、Stage Charter 不被 React fallback 接管、v12/v14 kernel 未被 v15 UI 任务修改。 |

## 当前支持的 Workbench 能力

- `symphony console` 在本地启动 read-only Workbench，默认监听 `127.0.0.1:8765`。
- `/` 保留既有 console HTML。
- `/workbench/` 服务 v15 React/Vite Workbench 构建产物。
- `pnpm workbench:build` 使用 Vite 构建静态产物到 `src/symphony/workbench-static/`。
- `pnpm workbench:dev` 仅用于前端源码调试，不是 console API parity 验证入口。
- Console / Workbench 当前只读 API：
  - `GET /api/summary`
  - `GET /api/readiness`
  - `GET /api/runs`
  - `GET /api/runs/latest`
  - `GET /api/runs/<run-id>`
  - `GET /api/runs/<run-id>/timeline`
  - `GET /api/runs/<run-id>/artifacts/<kind>`
  - `GET /api/adoptions/<adoption-id>/inspect`
- 所有非 `GET` Workbench / API 请求按只读边界返回 `405`。
- React Workbench 展示 readiness、latest run health、run diagnostics、run filters、risk panel、run detail、registered artifact refs、adoption plan refs、patch refs、changed files、timeline、artifact refs/list、adoption summary 与 grouped copy-only commands。
- `/workbench` app route fallback 只覆盖 Workbench 路由；`/api/*`、非 Workbench route、Stage Charter HTML / JSON 和仓库文件路径不被 React fallback 覆盖。
- Static serving 只读取 `src/symphony/workbench-static/`，不暴露仓库根目录、本地任意文件、`docs/`、source file、lockfile 或 traversal probe 内容。

## 明确不支持的能力

v15 Workbench 不提供、不应暗示、也未实现以下浏览器能力：

- write / execute / retry。
- adopt / apply / confirm-adoption / rollback。
- delete / install / dependency install。
- mutation trigger / audit trigger。
- model invocation / real agent invocation。
- package installer、terminal action、真实 CLI action。
- 任意本地文件读取、任意路径输入、任意 artifact 预览入口。
- artifact inline preview。
- Stage Charter HTML / JSON 的替换、编辑或解析。
- 将 React/Vite Workbench 作为 canonical state。
- 通过浏览器修改 `.symphony`、ArtifactStore、run state、adoption state、Stage state 或项目文件。

## Deferred contract gaps

以下 gap 在 Task 1、Task 5、Task 7、Task 8、Task 10、Task 11 evidence 中反复记录，v15 closure 不补齐、不伪造：

- Artifact preview contract 缺稳定 `uri` 或 `ref`。
- Artifact preview contract 缺 `mime`。
- Artifact preview contract 缺 `title` 或 `displayTitle`。
- Artifact preview contract 缺 `safeToRenderInline`。
- Artifact preview contract 缺 `sourceRunId`。
- Artifact preview contract 缺 `artifactKind`。
- Artifact preview contract 缺 `previewAvailable`。
- Artifact preview contract 缺 `sizeBytes`。
- `/api/summary` 与 `/api/readiness` 尚无 shared top-level `capabilities` object；当前 contract 通过已暴露只读字段和 copy-only command mode 表示安全边界。
- Error envelopes 仍是 route-local，尚未统一为全 route shared envelope。
- Dirty adoption 仍由 pending adoption summary 与 Git readiness signal 组合展示，没有 dedicated browser `GET /api/diagnostics` route。
- Stage Charter consistency failure fixture 仍记录为当前 route shape；console server / `buildConsoleSnapshot` 尚无专用 Stage docs directory fixture option。

## 后续 v16 / backlog 建议

- 设计并评审 artifact preview API contract，先补齐 `uri/ref`、MIME、display label、size、source run、artifact kind、preview availability、inline safety 与 truncation 字段，再考虑 React inline preview。
- 如果需要 diagnostics 页面，先定义 dedicated read-only diagnostics contract；不要让前端从 summary/readiness 私自合成安全结论。
- 统一 API error envelope 和 shared capabilities object，并增加 fixture-backed tests。
- 若要移除 legacy console HTML 或改变 `/` 入口，作为独立 reviewer-approved removal step 处理；v15 默认保留 legacy fallback。
- 若要增加 browser/E2E 测试工具、UI framework、icon library、TypeScript 或额外 frontend dependency，先走单独 dependency plan 和 independent reviewer。
- 继续保持 Stage Charter HTML / JSON 独立，不让 React Workbench 读取、解析或替代。
- 对 `pnpm audit --audit-level high` 中记录的 `1` 个 moderate vulnerability 建立 backlog 追踪；当前 high gate 不阻塞，但如果 release policy 提升到 moderate 阈值，需要单独处理。
- 若 mutation gate 阈值或覆盖策略提高，单独处理 Task 11 记录的 survived / no coverage mutants。

## Closure 结论

以当前 evidence 和 Task 11 release verification 为准，v15 Workbench React/Vite migration 已完成计划内 closure：

- React/Vite Workbench 作为本地 read-only / display-only / copy-only 状态面可构建、可服务、可 smoke。
- v15 未把浏览器变成执行面、写入面、模型调用面、依赖安装面或任意文件读取面。
- v15 保留 `/` legacy console HTML，React Workbench 入口为 `/workbench/`。
- v15 没有把 Stage Charter HTML / JSON 并入 React app。
- v15 没有修改 Task 11 核对范围内的 v12 adoption safety kernel、v14 Stage kernel / gate、ArtifactStore、verifier、policy engine、workspace manager 或 bridge。
- 剩余事项均为明确 backlog / v16 contract work，不应在 v15 closure 中顺手实现。
