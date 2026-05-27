# v16 Task 4 Read-Only Handoff API Evidence

日期：2026-05-27

任务：v16 Task 4 read-only API exposure

## 任务目标

本任务把 Task 2 冻结的 `guided-goal-handoff.v1` contract 暴露为只读 GET API，供后续 Workbench 面板读取。API 只返回 registered handoff ref，不接受任意文件路径，不执行命令，不调用模型，不写 state，不新增 POST / PUT / PATCH / DELETE 路径。

## 前置核对

- 当前任务从 `main` 开始。
- `git checkout main`：通过，已在 `main`。
- `git pull`：通过，输出 `Already up to date.`。
- `main` / `origin/main` 当前 HEAD：`12180b2 Generate v16 guided handoff output`。
- `git log --oneline --decorate -8` 显示 Task 3 已在 `main`，历史包含 `fb6930a Add v16 handoff contract fixtures`、`3410509 Approve v16 guided handoff baseline` 和 `2c1b9b9 (tag: v15) Prepare v15 tag release evidence`。
- 任务开始前 `git status -sb` 输出 `## main...origin/main`，工作区干净。
- `git diff --check` 无输出。
- `git diff -- package.json pnpm-lock.yaml` 无输出。

Task 4 preflight 已执行：

- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`546` tests / `90` suites，`546` pass，`0` fail，duration `2909.112667ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 Workbench static assets；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。

Task 4 分支：

- `git switch -c v16-task4-readonly-handoff-api`：通过。

## 本任务变更文件

- `src/symphony/console.js`
- `src/symphony/guided-goal-handoff-output.js`
- `tests/workbench-route-smoke.test.js`
- `docs/plans/v16-task4-readonly-handoff-api-evidence-2026-05-27.md`

本任务未修改 README、Workbench React 前端、Workbench static build output、CLI worker execution path、核心执行 kernel、`package.json` 或 `pnpm-lock.yaml`。

## Route contract

新增 GET route：

- `GET /api/handoff`
- `GET /api/handoff/guided-goal-handoff.v1`

`GET /api/handoff` 返回 registered ref index：

- `contractName: symphony.handoff-refs`
- `contractVersion: 1`
- `readOnly: true`
- `arbitraryPathReads: false`
- `refs[0].ref: guided-goal-handoff.v1`
- `refs[0].href: /api/handoff/guided-goal-handoff.v1`

`GET /api/handoff/guided-goal-handoff.v1` 返回 Task 2 fixture contract 本体，输出前经过 `assertGuidedGoalHandoffContract()` 校验。

拒绝规则：

- 非 GET 由现有 console server read-only gate 返回 `405`。
- `/api/handoff/<unknown-ref>` 返回 `404`。
- query 参数返回 `400`。
- ref 为空、包含 `/`、包含 `\`、包含 `..` 或 URL decode 失败时返回 `400`。
- route 不把 URL path 或 query 作为文件路径读取。

## 实现说明

`src/symphony/guided-goal-handoff-output.js` 新增：

- `GUIDED_GOAL_HANDOFF_REGISTERED_REF`
- `GUIDED_GOAL_HANDOFF_API_PATH`
- `buildGuidedGoalHandoffRefIndex()`

`src/symphony/console.js` 新增：

- `parseHandoffRequestPath(pathname, searchParams)`
- `writeHandoffResponse({ response, request })`
- `safeDecodePathSegment()`
- `isUnsafeHandoffRef()`
- `hasSearchParams()`

route 读取固定 bundled fixture：`fixtures/contracts/guided-goal-handoff.v1.json`。请求参数只用于匹配 registered ref，不参与文件路径拼接。

## 测试覆盖

更新测试：`tests/workbench-route-smoke.test.js`。

测试覆盖：

- `GET /api/handoff` 返回 `symphony.handoff-refs`，且只登记 `guided-goal-handoff.v1`。
- `GET /api/handoff/guided-goal-handoff.v1` 返回合法 `guided-goal-handoff.v1` contract。
- GET handoff route 不写 `.symphony` state。
- `POST` / `PUT` / `PATCH` / `DELETE` / `HEAD` 到 `/api/handoff` 和 `/api/handoff/guided-goal-handoff.v1` 均返回 `405`。
- `/api/handoff/package.json` 和 `/api/handoff/guided-goal-handoff.v2` 返回 `404`。
- `/api/handoff/guided-goal-handoff.v1?path=package.json` 返回 `400`。
- encoded traversal probes 返回 `400`，包括 `%2e%2e%2fpackage.json`、`%5c..%5cpackage.json`、`..%2fpnpm-lock.yaml`。
- traversal / unknown-ref probes 不返回 `package.json`、lockfile 或 server source 内容。
- invalid handoff probes 不写 `.symphony` state。

Focused test 结果：

- 首次执行 `node --test tests/workbench-route-smoke.test.js tests/guided-goal-handoff-cli.test.js tests/guided-goal-handoff-contract.test.js`：通过，`14` tests / `3` suites，`14` pass，`0` fail，duration `114.31925ms`。
- GET route state-write 断言补充后再次执行同一 focused test：通过，`14` tests / `3` suites，`14` pass，`0` fail，duration `116.064333ms`。
- evidence 写入后再次执行同一 focused test：通过，`14` tests / `3` suites，`14` pass，`0` fail，duration `125.388375ms`。
- reviewer 指出 diff stat 修正后再次执行同一 focused test：通过，`14` tests / `3` suites，`14` pass，`0` fail，duration `115.959125ms`。
- reviewer gate 记录补充后再次执行同一 focused test：通过，`14` tests / `3` suites，`14` pass，`0` fail，duration `128.015125ms`。

## Post-task 验证记录

Task 4 worker self-check 已执行：

- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`547` tests / `90` suites，`547` pass，`0` fail，duration `2974.182708ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 Workbench static assets；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。
- evidence 写入后再次执行 `pnpm check`：通过，退出码 `0`。
- evidence 写入后再次执行 `pnpm test`：通过，`547` tests / `90` suites，`547` pass，`0` fail，duration `2920.000625ms`。
- evidence 写入后再次执行 `pnpm workbench:build`：通过，Vite 成功构建 Workbench static assets；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。
- `git diff --check`：通过，无输出。
- evidence 写入后再次执行 `git diff --check`：通过，无输出。
- reviewer 指出 diff stat 修正后再次执行 `git diff --check`：通过，无输出。
- reviewer gate 记录补充后再次执行 `git diff --check`：通过，无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。
- 新增 evidence 纳入 intent-to-add 后，`git status -sb` 显示当前分支 `v16-task4-readonly-handoff-api`，只有本任务 4 个文件变更。
- `git diff --name-only`：只输出本任务 4 个文件。
- `git diff --stat`：`4 files changed, 410 insertions(+)`。
- `git diff -- src/symphony/console.js src/symphony/guided-goal-handoff-output.js tests/workbench-route-smoke.test.js | rg -n "POST|PUT|PATCH|DELETE|writeFile|appendFile|execFile|spawn|NodeProcessRunner|model|audit|mutation|install|path=|\\.\\."`：输出均为测试里的 non-GET / traversal probe、`path=` query 拒绝断言、`..` 拒绝逻辑，或既有 import context；未新增执行入口、模型调用、写文件调用或 dependency 安装。

## 安全边界

本任务确认：

- API 只挂在现有 console server 的 GET-only read-only gate 下。
- 不新增 POST / PUT / PATCH / DELETE route。
- 不接受任意 filesystem path。
- 不从 request path 或 query 拼接读取文件。
- 不执行 handoff commands。
- 不调用 worker、model、audit、mutation 或 install。
- 不新增浏览器执行面。
- 不新增依赖，不修改 `package.json` / `pnpm-lock.yaml`。
- 不修改 v12 adoption safety boundary、v14 Stage boundary、v15 Workbench read-only boundary。
- 不修改 Workbench React API client；Task 5 再接只读面板。

## 待独立 reviewer 核对

独立 reviewer 需要确认：

- 当前 diff 是否只完成 Task 4 范围。
- route 是否 GET-only，并且非 GET 返回 `405`。
- route 是否只返回 registered `guided-goal-handoff.v1` ref。
- unknown ref、query path、encoded traversal 是否被拒绝。
- route 是否没有任意路径读取、命令执行、模型调用或 state 写入。
- focused tests 是否覆盖 read-only route、non-GET 和 traversal probes。
- 是否没有新增 Workbench 前端执行面、API 写路径、依赖或 lockfile diff。
- evidence 是否中文、路径正确、验证记录真实。

## 独立 reviewer gate

独立 reviewer 首次返回 `NEEDS_REVISION`。

reviewer 指出的问题：

- evidence 中 `git diff --stat` 记录为 `4 files changed, 380 insertions(+)`，但当时当前 diff 实际为 `4 files changed, 387 insertions(+)`。
- 该问题只涉及 evidence 统计过期，不涉及 route 实现或测试失败。

修正后复核结果：

- 独立 reviewer 已返回 `APPROVED`。
- reviewer 确认当前 diff 只包含本任务 4 个文件。
- reviewer 确认 handoff route 在现有 GET-only console gate 后面。
- reviewer 确认 route 只接受 registered `guided-goal-handoff.v1` ref。
- reviewer 确认 route 只读取固定 bundled fixture。
- reviewer 确认 `git diff --check` 通过，package / lock diff 为空，focused tests `14` tests / `0` fail。
- reviewer 未发现 POST / PUT / PATCH / DELETE route、任意路径读取、model / worker / audit / mutation / install 调用、浏览器执行面、依赖变更或 safety boundary 越界。

## 结论

v16 Task 4 worker 实现已完成，并已通过独立 reviewer gate。当前状态可以进入 commit、push、merge 回 `main` 的闭环流程。
