# v15 Workbench React/Vite Migration Implementation Plan

Date: 2026-05-26
Status: HOLD, pending independent reviewer approval
Baseline: v14 released; v15 discovery approved at `3a2a019`

## 1. v15 Implementation 目标

v15 implementation 的目标是把现有 `symphony console` Workbench 的浏览器展示层迁移到 React/Vite，同时保持它仍然是中文优先、低信息密度、read-only、copy-only 的本地状态面。

必须保留的产品语义：

- v15 只做 Workbench React/Vite Migration / Stage Dashboard Foundation。
- Workbench 只展示状态、风险、阻塞、产物引用、诊断和仅复制命令。
- Workbench 不是 execution surface，不触发写入、执行、采纳确认、回滚、删除、依赖安装、audit、mutation、模型调用或真实 agent 调用。
- React/Vite Workbench 不成为 canonical state。
- Stage Charter JSON/HTML 仍是独立 Stage display artifact；React/Vite Workbench 不替代、不编辑、不解析 Stage Charter HTML。
- `.symphony` 只保存 summary、ref、pointer。
- 完整 high-risk evidence、repair plan、blocked snapshot、adoption-aware evidence 继续进入 ArtifactStore。
- v14 Stage kernel、Stage gate、blocked snapshot recovery、v12 adoption safety kernel 必须保持行为不变。

Discovery approved 不等于 implementation approved。本计划通过 reviewer 审查之前，v15 implementation 仍然 HOLD。

## 2. 非目标

- 不改 v12 adoption apply。
- 不改 v12 fingerprint verification。
- 不改 v12 dirty worktree checks。
- 不改 v12 `git apply --check`。
- 不改 v14 Stage kernel。
- 不改 Stage gate。
- 不改 blocked snapshot recovery。
- 不新增 GitHub / PR integration。
- 不把 `mcas` 重新变成日常主入口。
- 不实现完整 Autopilot。
- 不实现 Agent Capability Registry。
- 不替代 Stage Charter HTML。
- 不新增浏览器 write / execute / retry / adopt-confirm / confirm-adoption / rollback / delete / package install / dependency install / model invocation / real agent invocation / arbitrary file read / arbitrary path input / mutation trigger / audit trigger 控件。
- 不新增任意文件路径输入、任意路径读取、任意 artifact 预览入口。
- 不把 raw JSON、run/evidence/adoption 细节放回首页默认视图。
- 不把 React/Vite dependency introduction 混入 UI migration task。

## 3. 边界

- API contract first: React/Vite UI 开始前，必须先冻结 `/api/summary`、`/api/readiness`、runs、timeline、artifacts、adoptions、diagnostics 的 fixture 和 contract shape。
- Read-only server: `/api/*` 保持 GET-only；`POST` / `PUT` / `PATCH` / `DELETE` 必须返回 `405`。
- Copy-only UI: 浏览器可以复制命令文本，但不能执行命令。
- Prohibited browser controls: 浏览器不得提供 write、execute、retry、adopt-confirm、confirm-adoption、rollback、delete、package install、dependency install、model invocation、real agent invocation、arbitrary file read、arbitrary path input、mutation trigger、audit trigger。
- Command display boundary: 所有命令只能以 copy-only text 展示；浏览器不能触发 install、audit、mutation、model、agent、write、adopt、rollback、delete。
- ArtifactStore boundary: `.symphony` 只保留 active Stage pointer、latest run pointer、ids、status、timestamps、counts、artifact refs、registered paths、top risks、blocker summary、next action、copy-only command text 等 compact state。完整证据、修复计划、blocked snapshot、adoption-aware evidence、patch artifact、Harness output、TaskPacket、verifier-readable artifacts 继续由 ArtifactStore 承担。
- Stage Charter boundary: React/Vite Workbench 只消费 API 暴露的 Stage summary，不读取或解析 `docs/stages/*.html`。
- Legacy fallback: React bundle 缺失、构建失败或静态资源服务失败时，`symphony console` 必须保留 legacy fallback，并且 `/api/*` 与 `symphony console --snapshot --json` 保持 v14-compatible。
- Dependency boundary: React/Vite dependency introduction 是 high-risk，必须 plan-only、independent reviewer、no auto-adopt。`package.json` / `pnpm-lock.yaml` 改动必须单独提交或单独变更组；更新 lockfile 后必须跑 `pnpm audit --audit-level high`。

## 4. 任务拆分

### Task 1: API contract inventory + fixtures

Risk: medium
Auto-adopt: 不允许

Scope:

- 冻结 `/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest`、`/api/runs/<run-id>`、`/api/runs/<run-id>/timeline`、`/api/runs/<run-id>/artifacts/<kind>`、`/api/adoptions/<adoption-id>/inspect` 的 fixture 和 contract shape。
- 明确 diagnostics 在 v15 中继续由 `/api/summary` + `/api/readiness` 派生，或新增 GET-only `/api/diagnostics`；若新增，必须 fixture-backed。
- 覆盖 no runs、no active Stage、active Stage、blocked Stage、Charter mismatch、missing artifact、pending adoption、dirty adoption fixtures。
- 不改 React/Vite。
- 不改 `package.json`。
- 不改 `pnpm-lock.yaml`。

Acceptance:

- 每个 route 都有固定 fixture、API route manifest entry、contract name、contract version、status enum、unified error envelope 预期。
- Summary/readiness fixtures 明确 `capabilities.readOnly=true`，且不得提供 browser-executable capability。
- Stage compact contract 明确包含 `owner`、`createdAt`、`updatedAt`、`charterHash`，并继续只暴露 summary/ref/pointer 级别字段。
- Contract fixtures 明确 Task 与 run/evidence/adoption 的 mapping、unified Stage/Run/Adoption timeline、blocker repair steps、blocker mismatch summary、frontend build/version metadata。
- Artifact preview contract 明确包含 `uri` 或 `ref`、`size` 或 `sizeBytes`、`mime`、`title` 或 `displayTitle`、`type`、`format`、`safeToRenderInline`、`truncated`、`sourceRunId`、`artifactKind`、`previewAvailable`。
- React 未来不需要从 raw path、Stage Charter HTML 或 `.symphony` 私有结构推断 UI 字段。
- 非 GET fixture 覆盖 `405`。
- Reviewer 能直接用 fixture 对比 v14 API 行为和 v15 预期。

### Task 2: React/Vite dependency introduction plan-only

Risk: high
Auto-adopt: 不允许

Scope:

- 只写 dependency plan，不安装依赖，不改实现。
- 候选 direct dependencies 限于 `react`、`react-dom`、`vite`、`@vitejs/plugin-react`；TypeScript、test/browser tooling 或 UI framework 必须另行说明理由。
- 不使用 CDN frontend assets。
- 不引入 UI component framework，除非 reviewer 单独批准。
- `package.json` / `pnpm-lock.yaml` 改动必须单独提交或单独变更组。

Acceptance:

- dependency plan 说明每个 dependency 的用途、runtime/dev 分类、最小版本策略、build script 策略、lockfile 更新方式、rollback/fallback 策略。
- independent reviewer 明确 APPROVE 后，才允许后续 dependency change。
- dependency change 不与 UI migration code 混在同一 task。
- 更新 lockfile 后必须跑 `pnpm audit --audit-level high` 并记录结果。
- 任何 dependency diff 都没有 auto-adopt path。

### Task 3: React/Vite shell + legacy fallback

Risk: high
Auto-adopt: 不允许

Scope:

- 建立最小 React/Vite shell，仅承载 Workbench runtime UI。
- 保留 `symphony console` 本地入口和 `symphony console --snapshot --json`。
- React bundle 缺失、构建失败或静态资源服务失败时必须保留 legacy fallback。
- `/api/*` 继续 server-owned；React static assets 不改变 API 路由语义。
- 不新增浏览器写入按钮。

Acceptance:

- `symphony console` 在 React bundle 存在时能服务 React shell。
- 删除或隐藏 React bundle 后，console 仍能返回 legacy fallback 或明确安全 fallback 页面。
- `GET /api/summary`、`GET /api/readiness`、runs、timeline、artifacts、adoptions routes 行为不回退。
- `POST` / `PUT` / `PATCH` / `DELETE` 对 Workbench API 仍返回 `405`。
- 首页无 write / execute / retry / adopt-confirm / confirm-adoption / rollback / delete / package install / dependency install / model invocation / real agent invocation / arbitrary file read / arbitrary path input / mutation trigger / audit trigger 控件。
- 所有命令只以 copy-only text 展示，浏览器不能触发 install、audit、mutation、model、agent、write、adopt、rollback、delete。

### Task 4: Workbench API client + type/contract layer

Risk: high
Auto-adopt: 不允许

Scope:

- React 只能通过 API client 消费 `/api/*` 和 snapshot。
- React 不直接 import 后端内部模块。
- React 不读取或解析 Stage Charter HTML。
- React/Vite Workbench 不作为 canonical state。
- API client 负责 error envelope、route manifest、contract version guard、copy-only command normalization、artifact preview safety fields。
- API client/type layer 负责 `capabilities.readOnly=true`、Stage compact fields、Task 与 run/evidence/adoption mapping、unified Stage/Run/Adoption timeline、blocker repair steps、blocker mismatch summary、frontend build/version metadata 的 typed/normalized shape。

Acceptance:

- UI component 只依赖 API client 暴露的 typed/normalized shape。
- Typed/normalized shape 固定 API route manifest、unified error envelope、artifact `uri`/`ref`、`size`/`sizeBytes`、`mime`、`title`/`displayTitle`、`type`、`format`、`safeToRenderInline`、`truncated`、`sourceRunId`、`artifactKind`、`previewAvailable`，以及 `capabilities.readOnly=true`。
- Stage compact type 包含 `owner`、`createdAt`、`updatedAt`、`charterHash`；UI 不从 Stage Charter HTML 或 raw JSON 反推这些字段。
- Task/run/evidence/adoption mapping 与 unified Stage/Run/Adoption timeline 由 API client 统一提供；UI 不拼接私有状态。
- blocker repair steps、blocker mismatch summary、frontend build/version metadata 有 fixture-backed type coverage。
- 没有从 `src/symphony/stage.js`、`state.js`、ArtifactStore 内部模块或 Stage Charter HTML 直接导入数据的 frontend path。
- raw JSON 只作为 debug/detail 展示，不驱动正常 UI。
- `.symphony` 的 summary/ref/pointer 边界在 contract tests 中被固定。
- artifact preview 不从 local path 推断 mime、安全性、title 或 source。

### Task 5: Overview / Stage Dashboard parity

Risk: medium
Auto-adopt: 不允许

Scope:

- 首页展示 Stage、goal、status、top risks、blocker、next action。
- 中文优先、低信息密度、read-only、copy-only。
- run/evidence/adoption/raw JSON 只在折叠详情中。
- 保持 v13/v14 首页原则：默认只回答当前阶段、是否安全、有什么阻塞、下一步复制什么命令。

Acceptance:

- no active Stage 时有中文空状态。
- active Stage 显示 Stage id、goal、status、top risks、blocker、next action。
- blocked Stage 和 Charter mismatch 显示 blocker 与仅复制 repair/inspect command。
- 首页 top risks 最多显示 3 条。
- 首页不显示完整 run state、完整 evidence、完整 adoption journal 或 raw JSON dump。
- 所有命令 `mode` 保持 `copy-only`，浏览器只提供复制行为。

### Task 6: Runs / Diagnostics / Artifacts / Adoptions tabs parity

Risk: high
Auto-adopt: 不允许

Scope:

- 迁移现有 Workbench 主要状态面：`总览`、`采纳`、`运行`、`诊断`、`产物`。
- Runs 保留 filters: `all`、`passed`、`failed`、`dry-run`、`real`、`scan`、`verify`、`adoption`。
- Diagnostics 保留 readiness、risk list、dirty adoption blockers、missing artifacts、copy-only grouped commands。
- Artifacts 保留 registered refs only、bounded preview、200 KiB preview cap、directory entry cap、missing/malformed/truncated states。
- Adoptions 保留 plan refs、journal refs、latest confirmation、worktree match status、copy-only inspect/confirm/status/diagnose commands。
- 保持 GET-only。
- `POST` / `PUT` / `PATCH` / `DELETE` 返回 `405`。
- 无 write / execute / retry / adopt-confirm / confirm-adoption / rollback / delete / package install / dependency install / model invocation / real agent invocation / arbitrary file read / arbitrary path input / mutation trigger / audit trigger 控件。

Acceptance:

- 五个 tab 的中文标签和主要空状态与 v13.1/v14 行为一致或更保守。
- Runs detail 显示 summary、timeline、risks、artifacts、changes、raw/debug detail，但 raw/debug 不在首页。
- Diagnostics 能展示 pending adoption、stale adoption、dirty worktree blocks adoption、adoption apply in progress、post-apply evidence failed、unsupported adoption changes。
- Artifact preview 只允许 registered artifact refs，不能输入任意路径。
- Adoption confirm 只能作为 copy-only terminal command 展示，浏览器不执行。
- 浏览器无 write / execute / retry / adopt-confirm / confirm-adoption / rollback / delete / package install / dependency install / model invocation / real agent invocation / arbitrary file read / arbitrary path input / mutation trigger / audit trigger 控件；浏览器不能触发 install、audit、mutation、model、agent、write、adopt、rollback、delete。
- 所有非 GET API route 的 `405` test 通过。

### Task 7: contract/UI regression tests

Risk: medium
Auto-adopt: 不允许

Scope:

- 覆盖 no runs、no active Stage、active Stage、blocked Stage、Charter mismatch、missing artifact、pending adoption、dirty adoption fixtures。
- 覆盖 GET-only、POST 405、copy-only commands、无写控件。
- 覆盖 React shell 与 legacy fallback。
- 优先使用现有 Node test/fetch/HTML inspection 能力；新增 browser/E2E tooling 必须走 Task 2 dependency review。

Acceptance:

- Contract tests 证明 route response shape 和 fixture 一致。
- UI regression tests 证明首页低信息密度、中文优先、copy-only。
- Safety tests 证明 DOM 中不存在 prohibited controls 或 action labels。
- Non-GET tests 覆盖 summary、readiness、runs、timeline、artifacts、adoptions、diagnostics route。
- Fallback tests 证明 React bundle missing/static asset failure 不破坏 console startup 和 `/api/*`。

### Task 8: release evidence

Risk: low
Auto-adopt: 不允许

Scope:

- 记录 v15 gates、smoke、fixture parity、dependency audit、reviewer result、residual risks。
- 明确哪些 task 被执行、哪些 task 仍 HOLD。
- 记录 legacy fallback 是否仍保留；fallback removal 不属于 v15 默认 release scope。

Acceptance:

- release evidence 包含 gate command、结果、测试数量或关键摘要。
- 记录 `pnpm audit --audit-level high` 结果。
- 记录 Workbench smoke: snapshot JSON、API GET、non-GET 405、React shell、legacy fallback。
- 记录 no browser write controls / no model invocation / no package install controls 的 reviewer 检查结论。
- 记录 residual risks，包括 dependency supply-chain、artifact preview contract、fallback removal deferred。

## 5. 依赖引入策略

React/Vite dependency introduction 是 high-risk，不能自动采纳。

执行顺序：

1. 先完成 Task 1 contract fixtures。
2. Task 2 只提交 dependency plan。
3. independent reviewer APPROVE dependency plan。
4. 才允许单独 dependency change group 修改 `package.json` / `pnpm-lock.yaml`。
5. lockfile 更新后运行 `pnpm audit --audit-level high`。
6. dependency change 审查通过后，才允许 React/Vite shell implementation。

策略约束：

- Direct dependency set 保持最小。
- 不使用 CDN。
- 不新增 UI framework。
- 不把 dependency diff 和 UI implementation diff 混在一起。
- 不把 dependency plan 的 reviewer approval 解释为整个 v15 implementation approval。
- 若需要 TypeScript、browser E2E、CSS tooling 或 lint tooling，必须在 dependency plan 中单独列出风险和替代方案。

## 6. 测试策略

Contract tests:

- 固定 `/api/summary`、`/api/readiness`、runs、timeline、artifacts、adoptions、diagnostics response shape。
- 固定 error envelope 和 non-GET `405`。
- 固定 artifact preview safety fields 和 preview limits。

Fixture tests:

- no runs。
- no active Stage。
- active Stage。
- blocked Stage。
- Charter mismatch。
- missing artifact。
- pending adoption。
- dirty adoption fixtures。

UI regression tests:

- 首页只显示 Stage、goal、status、top risks、blocker、next action。
- run/evidence/adoption/raw JSON 只在折叠详情或 secondary tab。
- 所有 visible labels、empty states、status text、command descriptions 中文优先。
- command rows 仅复制，不执行。
- DOM 中不存在 write / execute / retry / adopt-confirm / confirm-adoption / rollback / delete / package install / dependency install / model invocation / real agent invocation / arbitrary file read / arbitrary path input / mutation trigger / audit trigger 控件。
- 所有命令只以 copy-only text 展示；浏览器不能触发 install、audit、mutation、model、agent、write、adopt、rollback、delete。

Fallback tests:

- React bundle 正常时服务 React shell。
- React bundle 缺失时服务 legacy fallback 或安全 fallback。
- static asset failure 不影响 `/api/*`。
- `symphony console --snapshot --json` 不受 frontend build 影响。

Development gate tests:

- `node --test tests/symphony-cli.test.js`
- `pnpm check`
- `pnpm test`
- `git diff --check`

Dependency introduction 后额外必须跑：

- `pnpm audit --audit-level high`

Release gate tests:

- `node --test tests/symphony-cli.test.js`
- `pnpm check`
- `pnpm test`
- `git diff --check`
- `pnpm audit --audit-level high`
- `pnpm test:mutation:gate`
- approved React/Vite build command from Task 2 dependency plan

Gate 分离要求：

- Development gate 通过不等于 release PASS。
- Release gate 必须由独立 reviewer 或 release review 阶段确认。
- Writer 自己跑过 gate 只能算 self-check，不是最终验收。

## 7. Reviewer 验收策略

Reviewer 分层：

- Implementation plan reviewer: 审查本文档。通过前，v15 implementation HOLD。
- Dependency reviewer: 单独审查 Task 2 dependency plan 和后续 `package.json` / `pnpm-lock.yaml` diff。
- Contract reviewer: 审查 fixture、route shape、error envelope、ArtifactStore / `.symphony` 边界。
- UI safety reviewer: 审查 React UI 是否中文优先、低信息密度、read-only、copy-only，无 prohibited controls。
- Release reviewer: 审查 gates、smoke、residual risks 和 release evidence。

Reviewer 必须确认：

- discovery approved 不等于 implementation approved。
- Implementation plan APPROVE 不等于 dependency approve。
- dependency changes plan-only + independent reviewer + no auto-adopt。
- Dependency introduction 仍然必须单独 plan-only + independent reviewer。
- `.symphony` 只保存 summary/ref/pointer。
- 完整 high-risk evidence、repair plan、blocked snapshot、adoption-aware evidence 继续进入 ArtifactStore。
- Stage Charter HTML 未被 React/Vite Workbench 替代。
- v12/v14 kernels 和 gates 未被修改。
- Workbench 仍是 local read-only status surface。
- Writer 不能自我宣布 release PASS。
- 关键阶段必须 independent reviewer，包括 dependency introduction、React/Vite shell replacement、API contract/type layer、console server fallback change、UI parity completion、release evidence。
- 如果 reviewer 给出 NEEDS_REVISION，writer 只能修 reviewer 指定范围。
- NEEDS_REVISION 修复不得顺手扩展功能、安装依赖、改 `package.json`、改 `pnpm-lock.yaml`、迁移 UI。
- reviewer APPROVE 后也只能进入下一阶段，不代表可以跳过后续 gate。

## 8. Release Gate

v15 release 只有在以下条件全部满足后才能从 HOLD 转为 release candidate：

- Task 1 到 Task 8 均有 reviewer-readable evidence。
- Task 2 dependency plan 和 dependency diff 均被 independent reviewer APPROVE。
- `package.json` / `pnpm-lock.yaml` 只出现在 dependency change group 中。
- `pnpm audit --audit-level high` 通过或 release evidence 明确记录 accepted residual risk；high vulnerability 默认阻塞 release。
- `node --test tests/symphony-cli.test.js` 通过。
- `pnpm check` 通过。
- `pnpm test` 通过。
- `git diff --check` 通过。
- `pnpm test:mutation:gate` 通过，或 release owner 明确接受 documented incremental mutation gate。
- `symphony console --snapshot --json` 仍返回 `symphony.console-snapshot`。
- Workbench API GET smoke 通过：summary、readiness、runs、latest run、timeline、artifact preview、adoption inspect、diagnostics strategy。
- Workbench non-GET smoke 通过：`POST` / `PUT` / `PATCH` / `DELETE` 返回 `405`。
- React shell smoke 通过。
- Legacy fallback smoke 通过。
- Fixture parity 覆盖 no runs、no active Stage、active Stage、blocked Stage、Charter mismatch、missing artifact、pending adoption、dirty adoption。
- Browser UI 无 write / execute / retry / adopt-confirm / confirm-adoption / rollback / delete / package install / dependency install / model invocation / real agent invocation / arbitrary file read / arbitrary path input / mutation trigger / audit trigger 控件。
- Browser UI 只能展示 copy-only command text，不能触发 install、audit、mutation、model、agent、write、adopt、rollback、delete。
- release evidence 记录 gates、smoke、reviewer result、residual risks。

通过本计划审查后，只表示可以开始 v15 implementation 的第一个受控 task；不表示允许跳过 Task 2 dependency review，也不表示允许自动采纳任何 implementation diff。
