# v15 Task 3 React/Vite 依赖引入 Evidence

日期：2026-05-27

任务：按已批准的 Task 2 依赖计划，受控引入 React/Vite 直接依赖，只更新 `package.json` 与 `pnpm-lock.yaml`，不实现 UI。

## 任务目标

本任务只为后续 React/Vite Workbench 实现建立依赖基础。目标是按 `docs/plans/v15-task2-react-vite-dependency-plan-2026-05-27.md` 中的批准清单引入四个 direct dependencies，并保持变更组与 UI 实现隔离。

## 前置状态

- Task 1 已完成、review approved，并已提交；Task 1 冻结的是 fixture-backed Workbench console API contract 基线。
- Task 2 已完成、review approved，并已提交；Task 2 允许 Task 3 只引入 `react`、`react-dom`、`vite`、`@vitejs/plugin-react`。
- 本任务开始前工作树干净。
- 本任务开始前 `package.json` 没有 `dependencies` 区块，`devDependencies` 只包含 `@stryker-mutator/core`、`@stryker-mutator/tap-runner`、`fast-check`。
- 本任务开始前 `pnpm-lock.yaml` 没有 importer-level 的 React/Vite direct dependency 条目。
- 当前 `pnpm` 版本为 `10.30.3`，与 `packageManager: "pnpm@10.30.3"` 一致。

## 变更文件

- `package.json`
- `pnpm-lock.yaml`
- `docs/plans/v15-task3-react-vite-dependency-evidence-2026-05-27.md`

本任务确实修改了 `package.json`。

本任务确实修改了 `pnpm-lock.yaml`。

## 实际引入的依赖

实际 direct dependencies 与 Task 2 批准清单一致：

| 包 | specifier | lockfile 解析版本 | 分类 |
| --- | --- | --- | --- |
| `react` | `^19.2.6` | `19.2.6` | `dependencies` |
| `react-dom` | `^19.2.6` | `19.2.6(react@19.2.6)` | `dependencies` |
| `vite` | `^8.0.14` | `8.0.14(yaml@2.9.0)` | `devDependencies` |
| `@vitejs/plugin-react` | `^6.0.2` | `6.0.2(vite@8.0.14(yaml@2.9.0))` | `devDependencies` |

安装命令：

```sh
pnpm add 'react@^19.2.6' 'react-dom@^19.2.6'
pnpm add -D 'vite@^8.0.14' '@vitejs/plugin-react@^6.0.2'
```

## dependencies 与 devDependencies 分类

- `react` 放入 `dependencies`，用于后续浏览器 Workbench view layer 和 component model。
- `react-dom` 放入 `dependencies`，用于后续把 React Workbench 挂载到 Vite entry HTML。
- `vite` 放入 `devDependencies`，只作为后续本地前端构建工具；console server runtime 不应 import Vite。
- `@vitejs/plugin-react` 放入 `devDependencies`，只作为 Vite build-time React transform 工具。

分类与 Task 2 approved 文档一致。

## package.json diff 摘要

- 新增 `dependencies` 区块：
  - `react: "^19.2.6"`
  - `react-dom: "^19.2.6"`
- 在既有 `devDependencies` 中新增：
  - `@vitejs/plugin-react: "^6.0.2"`
  - `vite: "^8.0.14"`
- 未新增、删除或修改任何 `scripts`。
- 未修改 `bin`。
- 未修改 `exports`。
- 未修改 `type`。
- 未修改 `packageManager`。
- 未修改 `engines`。
- 未修改既有 `@stryker-mutator/core`、`@stryker-mutator/tap-runner`、`fast-check` 版本。

## pnpm-lock.yaml 变化摘要

- importer `.` 新增：
  - `dependencies.react`
  - `dependencies.react-dom`
  - `devDependencies.vite`
  - `devDependencies.@vitejs/plugin-react`
- 新增 React runtime 相关解析：
  - `react@19.2.6`
  - `react-dom@19.2.6`
  - `scheduler@0.27.0`
- 新增 Vite/plugin React 相关解析：
  - `vite@8.0.14`
  - `@vitejs/plugin-react@6.0.2`
  - `rolldown@1.0.2`
  - `lightningcss@1.32.0`
  - `postcss@8.5.15`
  - `tinyglobby@0.2.16`
  - 相关 optional platform packages
- `lockfileVersion` 未变化，仍为 `9.0`。
- `settings` 未变化。
- 既有 `@stryker-mutator/*` 与 `fast-check` importer 条目语义未变化。
- 变化由 `pnpm` 正常生成，不手写 lockfile。

`git diff --stat -- package.json pnpm-lock.yaml` 摘要为：`package.json` 8 行变化，`pnpm-lock.yaml` 520 行变化，合计 527 insertions、1 deletion。

## 未引入的依赖与暂缓理由

- 未引入 `typescript`、`@types/react`、`@types/react-dom`：Task 2 未批准 Task 3 引入 TypeScript 或类型包；当前项目仍是 JavaScript ESM。
- 未引入 `vitest`、`jsdom`、`@testing-library/react`、Playwright 或 browser/E2E 工具：Task 2 明确暂缓浏览器测试工具，后续需要单独依赖评审。
- 未引入 ESLint、Prettier、CSS tooling、Tailwind、Sass、PostCSS plugins：Task 2 未批准 Task 3 引入 lint/format/CSS 工具。
- 未引入 UI component framework、state management library、data fetching library、icon library：Task 2 明确排除。
- 未新增 build/test scripts：Task 2 要求脚本等到 React/Vite shell 文件存在后再加，避免 script 指向不存在的 frontend 文件。

## 未实现的内容

- 没有创建 React 组件。
- 没有创建完整 Vite app。
- 没有创建 Workbench frontend shell。
- 没有新增 frontend source tree。
- 没有新增 Vite config。
- 没有新增 `index.html`。
- 没有新增前端 API client。
- 没有新增 artifact preview UI。
- 没有新增 Stage overview UI。
- 没有新增浏览器端 write / execute / retry / adopt / apply / rollback / delete / install / model / mutation / audit 控件。
- 没有修改 console server 行为。
- 没有生成或提交 build output。

## 安全边界确认

- 本任务只是 dependency-only 变更，为后续 React/Vite 实现建立依赖基础。
- 本任务没有实现 React/Vite UI。
- 本任务没有新增浏览器执行控件。
- 本任务没有新增浏览器写入控件。
- 本任务没有新增 package install、dependency install、audit、mutation、model invocation 或 real agent invocation 控件。
- 本任务没有修改 v12 adoption safety kernel。
- 本任务没有修改 v12 fingerprint verification、dirty worktree check 或 `git apply --check` 逻辑。
- 本任务没有修改 v14 Stage kernel。
- 本任务没有修改 Stage gate。
- 本任务没有修改 blocked snapshot recovery。
- 本任务没有修改 verifier、policy engine、workspace manager 或 ArtifactStore 边界。
- 本任务没有修改 `.symphony` / ArtifactStore evidence 边界。
- 本任务没有修改 Stage Charter HTML/JSON 边界。

## Task 1 API contract 边界确认

- 本任务没有修改 Task 1 API fixture contract。
- 本任务没有修改 `tests/symphony-cli.test.js`。
- 本任务没有修改 `/api/summary`、`/api/readiness`、runs、timeline、artifacts、adoptions route 行为。
- 本任务没有修改 console server 的 GET-only / non-GET 405 行为。
- 本任务没有让前端推断 Task 1 deferred contract gaps。
- 本任务没有通过前端、文档或伪字段解决 Task 1 deferred gaps。

Task 1 deferred gaps 继续保持为 API contract 问题，不在本任务中由前端推断：

- artifact preview 缺 `uri` / `ref`。
- artifact preview 缺 `mime`。
- artifact preview 缺 `title` / `displayTitle`。
- artifact preview 缺 `safeToRenderInline`。
- artifact preview 缺 `sourceRunId`。
- artifact preview 缺 `artifactKind`。
- artifact preview 缺 `previewAvailable`。
- artifact preview 缺 `sizeBytes`。
- 没有 shared top-level `capabilities` object。
- error envelopes 仍是 route-local。
- dirty adoption 当前仍由 pending adoption + dirty Git readiness 派生。

## Task 2 计划符合性

- direct dependency set 精确保持为 `react`、`react-dom`、`vite`、`@vitejs/plugin-react`。
- `react` 与 `react-dom` 按 Task 2 放入 `dependencies`。
- `vite` 与 `@vitejs/plugin-react` 按 Task 2 放入 `devDependencies`。
- 没有引入 Task 2 排除的 TypeScript、test/browser tooling、lint/format tooling、UI framework、state management、data fetching 或 icon library。
- 没有新增 build/dev script，因为 Task 2 明确将脚本延后到 React/Vite shell 文件存在后。
- 没有混入 UI migration code。
- `pnpm-lock.yaml` 由 `pnpm` 正常生成。
- package/lockfile 变更与 UI 实现隔离。
- 运行 `pnpm audit --audit-level high`，满足 Task 2 对 lockfile 更新后的 audit 要求。

## 验证命令

```sh
pnpm check
pnpm test
pnpm audit --audit-level high
git diff --check
git diff -- package.json pnpm-lock.yaml
```

## 验证结果

- `pnpm check`：通过。
- `pnpm test`：通过，`518` tests，`518` pass，`0` fail。
- `pnpm audit --audit-level high`：通过，命令退出码为 `0`；输出显示 `1 vulnerabilities found`，级别为 `1 moderate`，没有 high 级别阻塞项。
- `git diff -- package.json pnpm-lock.yaml`：通过，命令退出码为 `0`；输出只显示 Task 2 允许的 dependency-only diff。
- `git diff --check`：通过；在本文档补齐验证结果后最终执行，确认当前 diff 无 whitespace error。

## 延后事项

- React/Vite shell、frontend source tree、Vite config、`index.html`、Workbench frontend shell 延后到后续任务。
- `workbench:build`、`workbench:dev` 等 scripts 延后到 shell 文件存在后。
- TypeScript、browser/E2E tooling、Vitest/jsdom、Testing Library、lint/format/CSS tooling 需要单独依赖评审后再决定。
- Artifact preview rich UI 继续等待 API contract 提供 `uri/ref`、`mime`、`title/displayTitle`、`safeToRenderInline`、`sourceRunId`、`artifactKind`、`previewAvailable`、`sizeBytes` 等字段。
- Shared top-level `capabilities` object、shared error envelope、diagnostics route、dirty adoption dedicated diagnostics 继续作为 API contract 后续事项。

## reviewer checklist

- [ ] 确认本任务只修改 `package.json`、`pnpm-lock.yaml` 和本 evidence 文档。
- [ ] 确认 `package.json` 只新增 Task 2 批准的四个 direct dependencies。
- [ ] 确认 `react` 与 `react-dom` 位于 `dependencies`。
- [ ] 确认 `vite` 与 `@vitejs/plugin-react` 位于 `devDependencies`。
- [ ] 确认没有引入 TypeScript、test/browser tooling、lint/format tooling、UI framework、state management、data fetching、icon library。
- [ ] 确认没有新增 scripts。
- [ ] 确认 `pnpm-lock.yaml` 变化来自 `pnpm` 正常依赖解析。
- [ ] 确认没有创建 React 组件。
- [ ] 确认没有创建 Vite app / frontend shell。
- [ ] 确认没有新增浏览器执行控件。
- [ ] 确认没有修改 v12 adoption safety kernel。
- [ ] 确认没有修改 v14 Stage kernel / Stage gate。
- [ ] 确认没有修改 Task 1 API fixture contract。
- [ ] 确认没有让前端推断 Task 1 deferred contract gaps。
- [ ] 确认验证命令全部通过。
