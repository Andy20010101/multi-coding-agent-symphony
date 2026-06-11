# v46 Workbench Supervisor Dashboard 验收检查

## 静态检查

命令：

```sh
pnpm workbench:v46:qa
```

这个命令来自根目录 `package.json` 的 `workbench:v46:qa` script，实际执行 `node scripts/workbench-v46-static-qa.js`。

检查对象：

- `frontend/workbench/src/v46SupervisorWorkbench.jsx` 渲染出的 `SupervisorShell` 静态 HTML。
- `/workbench/supervisor/` 路由经 `WorkbenchShell` SSR 后的静态 HTML，用来确认旧 Workbench header/status strip 没有重新包回 v46 页面。
- `frontend/workbench/src/v46SupervisorWorkbench.jsx` 源文件。
- `frontend/workbench/src/styles/workbench.css` 里 v46 样式区块，从首个 `.v46-` 样式到旧 `.workbench-shell` 样式之前。

检查内容：

- 禁用交互和执行入口：`<button`、`<a `、`href=`、`fetch(`、`/api`、`<script`、`onclick`、`role="button"`、`cursor: pointer`、`<input`、`<label`、`<form`、`<select`、`<textarea`。
- 禁用展开/折叠和隐藏内容口径：`Show all`、`disclosure`、`details`、`summary`。
- 禁用可执行动作标签：`Run`、`Execute`、`Approve`、`Dispatch`、`Apply`、`Release`、`Publish`、`Tag`、`Closeout`。
- 禁用侧边栏竖排或旋转标签：`writing-mode`、`rotate(`、`vertical-rl`、`sideways`。

脚本自身的覆盖检查：

- 渲染 HTML 必须包含 `sidebar`、`status-header`、`goal-snapshot`、`active-lease`、`current-gate`、`recommended-next-action`、`context-status`、`pending-result`、`command-boundary`、`goal-timeline`、`ownership` 这些 `data-od-id`。
- 源文件必须包含冻结的 `SUPERVISOR_WORKBENCH_VIEW`、`SupervisorShell` export、`[ EMPTY ]` pending contract。
- `/workbench/supervisor/` 路由必须包含 `workbench-shell supervisor-shell-route` 和 `v46-supervisor-shell`，并且不得包含旧外层 `workbench-header`、`header-copy`、`workbench-title` 或 `status-strip`。
- CSS 区块必须包含桌面 `232px` sidebar grid、sidebar label 样式、`980px` 和 `520px` 响应式断点。

通过标准：命令输出 JSON，`status` 为 `ok`，`scanScope.defaultScope` 为 `v46 supervisor route only`。失败时命令返回非零退出码，并打印命中的文件、行、列和文本。

如果需要检查额外的静态 HTML 产物，可以把文件路径追加到命令后：

```sh
node scripts/workbench-v46-static-qa.js /absolute/path/to/v46-static.html
```

不要直接把当前 Vite `src/symphony/workbench-static/index.html` 或 `src/symphony/workbench-static/assets/index-*.js|css` 当作 v46 页面验收目标。脚本默认不扫描这些文件；如果把这些已知 Vite bundle 文件作为外部参数传入，脚本会直接报错。当前 bundle 仍包含旧 Workbench 路由、API 客户端、历史导航代码和 Vite loader `<script>`，这些内容不代表 v46 supervisor 路由本身。

## 视觉检查

仓库当前没有 Playwright、Puppeteer、jsdom 或浏览器测试配置。视觉验收先用本地 Vite 页面和浏览器控制台完成。

启动页面：

```sh
pnpm workbench:dev
```

打开：

```text
http://127.0.0.1:5173/workbench/supervisor/
```

桌面检查：

- 视口设为 `1440x900`。
- 页面路径为 `/workbench/supervisor/`。
- 截图确认第一屏包含 Goal Snapshot、Active Lease、Current Gate、Recommended Next Action、Context Status、Command Boundary。
- 控制台运行下面的检查片段。

移动检查：

- 视口设为 `390x844`。
- 页面路径为 `/workbench/supervisor/`。
- 横向滚动条不能出现。
- sidebar 标签保持横排，允许横向静态 strip 滚动。
- 控制台运行同一段检查片段。

```js
(() => {
  const header = document.querySelector('.v46-status-header')?.getBoundingClientRect();
  const goalLine = document.querySelector('.v46-goal-line')?.getBoundingClientRect();
  const goalLabel = document.querySelector('.v46-goal-line > span')?.getBoundingClientRect();
  const goalId = document.querySelector('#v46-supervisor-title')?.getBoundingClientRect();
  const sidebar = document.querySelector('.v46-sidebar')?.getBoundingClientRect();
  const commandBoundary = document.querySelector('[data-od-id="command-boundary"]')?.getBoundingClientRect();
  const sidebarWritingModes = [...document.querySelectorAll('.v46-sidebar-label')]
    .map((node) => getComputedStyle(node).writingMode);

  return {
    viewport: `${innerWidth}x${innerHeight}`,
    horizontalOverflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    goalLineCenterDeltaPx: header && goalLine
      ? Math.round((goalLine.left + goalLine.width / 2) - (header.left + header.width / 2))
      : null,
    goalLabelBottomDeltaPx: goalLabel && goalId ? Math.round(Math.abs(goalLabel.bottom - goalId.bottom)) : null,
    sidebarWidthPx: sidebar ? Math.round(sidebar.width) : null,
    commandBoundaryInFirstViewport: commandBoundary ? commandBoundary.top < innerHeight && commandBoundary.bottom > 0 : false,
    sidebarWritingModes
  };
})();
```

通过标准：

- 桌面和移动视口 `horizontalOverflowPx` 都为 `0`。
- 桌面视口 `goalLineCenterDeltaPx` 在 `-2` 到 `2` 之间。
- 桌面视口 `goalLabelBottomDeltaPx` 不超过 `4`。
- `Goal ID:` 和完整 goal ID 同行或自然换行后仍可完整阅读。
- 桌面视口 `sidebarWidthPx` 在 `220` 到 `240` 之间。
- `sidebarWritingModes` 全部是水平书写模式。
- 桌面视口 `commandBoundaryInFirstViewport` 为 `true`。
- Timeline 直接展开，没有折叠入口。

## 最新验收记录

最后一次本地验证时间：2026-06-11，Asia/Shanghai。

命令结果：

- `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`：88 pass。
- `pnpm workbench:v46:qa`：`status: ok`，包含 route-level legacy header 缺席检查。
- `pnpm workbench:build`：PASS，当前静态页面引用 `index-BsCE7mzH.js` 和 `index-DK3WOan4.css`。
- `pnpm check`：PASS。
- `git diff --check`：PASS。

最新视觉证据：

- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/desktop-1440x900.png`
- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/mobile-390x844.png`
- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/mobile-390x844-fullpage.png`
- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/summary.json`

实测指标：

- 桌面 `1440x900`：`horizontalOverflowPx=0`，sidebar `232px`，Goal ID center delta `0px`，Goal ID bottom delta `-0.66px`，Goal Snapshot 标题 `1` 行，Command Boundary 在首屏可见，Timeline 静态展开。`pendingResult.output` 字段名保持单行，`white-space=nowrap`，row overflow `0`。
- 移动 `390x844`：`horizontalOverflowPx=0`，Goal ID 自然换为 `2` 行且无裁切，Goal Snapshot 标题 `1` 行，移动顺序为 Header、Goal Snapshot、Active Lease、Current Gate、Recommended Next Action、Pending Result、Command Boundary、Context Status、Goal Timeline、Ownership。`pendingResult.output` 在移动单列布局中正常换行策略为 `white-space=normal`，row overflow `0`。

补充说明：最新 `summary.json` 中的页面级 `hrefs=1` 来自静态 HTML 的 stylesheet `link`，不是 v46 dashboard surface 的可点击链接。v46 supervisor surface 仍无 `button`、`a`、form control、`role="button"`、`details/summary` 或执行入口。

默认 `/workbench/supervisor/` 现在使用 v46 local sample fallback：`v45-backend-entrypoint-decomposition`。旧 fixture 仍可通过 `?scenario=release-ready` 等参数用于回归检查，但不再是裸 supervisor route 的默认视觉状态。
