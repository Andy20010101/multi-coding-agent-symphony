# v16 计划：Guided Goal Handoff + Safe Artifact Preview Contract

日期：2026-05-27
中文名：目标执行手册与安全产物预览层

## 背景

当前 `main` / `origin/main` 基线为 `2c1b9b9 Prepare v15 tag release evidence`，并已打 `v15` tag。v15 完成 React/Vite read-only Workbench migration：Workbench 可展示 summary、readiness、runs、latest run、timeline、artifact refs/list、adoption summary 与 copy-only commands，但不提供浏览器写入、执行、retry、adopt/apply/rollback、install、mutation、audit、model invocation 或任意本地文件读取能力。

v15 closure 明确留下两类 v16 / backlog 事项：

- artifact preview contract 缺稳定 `uri/ref`、`mime`、display label、size、source run、artifact kind、preview availability、inline safety 与 truncation 字段。
- diagnostics、shared capabilities、error envelope 仍需独立 contract，不应由前端私自从 summary/readiness 合成安全结论。

v16 不延续为 Autopilot，也不把 Workbench 变成执行面。v16 的中心是把“大目标 -> writer / reviewer / verifier / release evidence”的受控分工流程产品化，并补齐安全产物预览 contract。

## v16 目标

- 定义并实现 Guided Goal Handoff contract：把大目标拆成可复制、可审查、可逐步执行的 handoff 手册。
- 明确 phase / role model：planner、worker、reviewer、verifier、release evidence 的职责、输入、输出、禁止事项与 evidence。
- 生成 copy-only next commands：Workbench 只能展示命令文本，用户复制到终端或 `/goal` 执行，不从浏览器触发写入或模型。
- 增加 review evidence 与 release evidence 的固定路径、状态格式、approved / needs revision gate。
- 定义 safe artifact preview contract：只有后端 contract 明确标注安全字段时，前端才可展示受限预览。
- 在 Workbench 中只读消费 handoff 与安全预览信息，继续保持 display-only / copy-only。
- 把 diagnostics、capabilities、error envelope 作为 backlog contract 明确登记，不在 v16 中顺手合并除非对应 task 单独批准。

## 非目标

- 不做 Autopilot。
- 不新增浏览器执行面。
- 不新增浏览器 adopt / apply / retry / rollback。
- 不让 Workbench 触发写入、模型、audit、mutation、安装或任意路径读取。
- 不把 Workbench 变成 canonical state。
- 不替换 Stage Charter HTML / JSON。
- 不修改 v12 adoption safety kernel、v14 Stage kernel / gate、v15 read-only Workbench 边界。
- 不新增 browser/E2E/UI library/TypeScript 依赖，除非先完成独立 dependency plan 并通过 reviewer。

## 用户痛点

当前复杂目标容易由单一 Codex 从头写到尾、自写自测、自我宣称通过。这样的问题是：

- 角色边界模糊：writer 同时做 reviewer，容易遗漏事实核对。
- 执行步骤靠聊天上下文保存，换 agent 后难以复现。
- review gate、commit、push、merge、main 后置验证缺少统一手册。
- evidence 路径和最终状态格式不稳定，release closure 成本高。
- Workbench 已能展示状态，但不能安全说明“下一步该复制什么命令”和“哪些产物可预览”。

v16 应把这些流程从临时 prompt 变成受控 contract 和只读产品面：用户仍然决定何时复制执行，系统只提供可审查、可追溯的手册。

## 产品与 Contract 设计

### Guided Goal Handoff schema

建议 contract 名称：`guided-goal-handoff.v1`。

核心字段：

- `contractVersion`：固定版本。
- `goalId`：稳定目标 id。
- `title` / `titleZh`：英文技术名与中文名。
- `baseline`：目标开始前的 `main` commit、tag、前置 evidence。
- `scope`：目标范围。
- `nonGoals`：非目标。
- `safetyBoundaries`：禁止能力和不得触碰模块。
- `tasks[]`：12 个 task 的编号、名称、依赖、角色、范围、风险、acceptance、禁止事项、验证建议、evidence path。
- `commands`：copy-only preflight、task branch、local validation、review、commit、push、merge、main post-merge validation。
- `reviewModel`：context isolation 要求。
- `releaseGates`：发布前必须满足的验证。
- `stopConditions`：停止条件。
- `deferredContracts`：diagnostics、capabilities、error envelope backlog。

### Phase / role model

- `planner`：定义目标、任务拆分、安全边界和 release gates。
- `worker`：只做当前 task；可以自测，但自测只算 self-check。
- `reviewer`：独立上下文，只读 diff 和仓库事实，不依赖 worker 叙述；输出 `APPROVED` 或 `NEEDS_REVISION`。
- `verifier`：在 task 合并后从 `main` 运行验证，确认主线闭环。
- `release-evidence`：汇总 task evidence、review 结果、验证结果、未完成 backlog。

### Copy-only next commands

Workbench 和文档只展示命令文本，不执行命令。命令必须明确：

- 从 `main` 同步。
- 新建 task branch。
- 执行当前 task。
- 本地验证。
- 独立 review。
- approved 后 commit / push。
- fast-forward merge 回 `main`。
- 在 `main` 后置验证。

### Review evidence

每个 task 产出中文 evidence，并建议 reviewer 产出独立中文 review evidence。review evidence 至少记录：

- 审查的 commit / branch / diff 范围。
- 独立读取的文件和命令。
- blocking findings。
- 非阻塞风险。
- `APPROVED` 或 `NEEDS_REVISION`。

### Release evidence

v16 release verification 不能只依赖 worker 自测。必须在 `main` 上记录：

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- focused handoff / preview tests
- safety scans
- `pnpm audit --audit-level high`，如仓库策略保持此 gate
- v12/v14/v15 safety boundary 未被越界修改

### Safe artifact preview contract

建议 contract 名称：`safe-artifact-preview.v1`。

后端必须显式提供：

- `ref`：稳定 artifact ref，不是用户输入路径。
- `uri`：只允许受控 API 路径或内部 preview URI，不允许任意 filesystem path。
- `mime`：后端探测或已登记 MIME。
- `displayTitle`：展示名。
- `artifactKind`：如 `project-context`、`intake-summary`、`patch-plan`、`evidence`。
- `sourceRunId`：来源 run。
- `sizeBytes`：大小。
- `previewAvailable`：是否可预览。
- `safeToRenderInline`：是否允许 inline render。
- `truncated` / `truncationReason` / `maxPreviewBytes`：截断状态。
- `contentText` 或 `previewText`：只在安全且大小受限时提供。
- `downloadAvailable`：默认 false；如未来开放需单独安全设计。

前端禁止推断这些字段。字段缺失时只能显示“未暴露 / 不可预览 / 等待 contract 补充”。

### Diagnostics / capabilities / error envelope backlog

v16 可登记但默认不实现：

- dedicated read-only diagnostics contract。
- shared top-level capabilities object。
- shared route error envelope。

如果某个 task 要实现这些内容，必须在 task 范围中明确批准并新增 fixture-backed tests。

## Task 拆分建议

### Task 1：v16 plan approval and baseline freeze

- 风险：计划边界不清会导致后续 task 扩散。
- 范围：冻结 v16 plan、handoff schema 草案、task 列表、禁止事项、review model。
- Acceptance：新增中文 plan approval evidence；确认 `v15` tag 基线；不改代码。
- 禁止事项：不实现功能；不新增依赖；不改 lockfile。
- 验证建议：`git status -sb`、`git log --oneline --decorate -8`、`git diff --check`、`git diff -- package.json pnpm-lock.yaml`。

### Task 2：handoff contract fixtures

- 风险：contract 未冻结就接 UI 会导致前端推断字段。
- 范围：新增 fixture-backed handoff contract 样例和 contract tests。
- Acceptance：fixtures 覆盖 tasks、roles、commands、evidence、review gates、stop conditions。
- 禁止事项：不接 Workbench；不新增执行 API；不新增依赖。
- 验证建议：focused contract tests、`pnpm check`、`pnpm test`。

### Task 3：CLI handoff generation

- 风险：CLI 输出被误解为自动执行。
- 范围：新增或扩展只生成 handoff 文本/JSON 的 CLI 能力，输出 copy-only commands。
- Acceptance：CLI 不写项目文件以外的受控 artifact；不执行命令；输出稳定 JSON/Markdown。
- 禁止事项：不调用模型；不触发 worker；不自动创建分支、commit、push。
- 验证建议：CLI tests、fixture snapshot、无写入越界扫描。

### Task 4：read-only API exposure

- 风险：API 被设计成命令执行入口。
- 范围：把 handoff artifact 以 `GET` route 暴露给 Workbench；只读。
- Acceptance：非 GET 返回 405；route 不读取任意路径；只返回 registered handoff refs。
- 禁止事项：不新增 POST/PUT/PATCH/DELETE；不接受 arbitrary path 参数。
- 验证建议：route smoke、安全扫描、focused API tests。

### Task 5：Workbench handoff panel

- 风险：按钮或 handler 暗示浏览器可执行。
- 范围：新增只读 handoff panel，展示 phases、roles、task status、copy-only commands。
- Acceptance：所有命令为文本复制；无执行按钮；缺失字段如实显示。
- 禁止事项：不新增写入 handler；不调用模型；不合成 safety 结论。
- 验证建议：`pnpm workbench:build`、UI focused tests、handler grep。

### Task 6：safe artifact preview contract fixtures

- 风险：预览字段不完整会造成 unsafe render。
- 范围：定义 `safe-artifact-preview.v1` fixtures 与 tests。
- Acceptance：覆盖 safe text、unsafe binary、oversize/truncated、missing safety fields、unknown mime。
- 禁止事项：不实现前端预览；不从路径推断安全字段。
- 验证建议：contract tests、fixture tests。

### Task 7：safe artifact preview implementation

- 风险：任意文件读取、过大内容、HTML/script inline render。
- 范围：后端只对 registered artifacts 生成受限 preview；大小、MIME、inline safety 由后端显式判断。
- Acceptance：path traversal blocked；HTML/script 不 inline；oversize 截断；缺字段不返回可预览。
- 禁止事项：不允许 arbitrary path；不提供 write/download 执行能力；不改 ArtifactStore 安全边界。
- 验证建议：focused preview tests、route smoke、安全扫描。

### Task 8：Workbench preview consumption

- 风险：前端推断 artifact safe fields 或展示危险内容。
- 范围：Workbench 只读消费 safe preview contract，展示 safe text preview、不可预览状态和 truncation。
- Acceptance：只使用后端字段；不渲染 raw HTML；无下载/执行/打开任意路径。
- 禁止事项：不新增 adopt/apply/retry/rollback；不新增 browser execution。
- 验证建议：`pnpm workbench:build`、frontend tests、grep safety scans。

### Task 9：route smoke and security coverage

- 风险：handoff 与 preview route 打开路径穿越或写入缺口。
- 范围：新增真实 console server smoke/security tests。
- Acceptance：GET parity、non-GET blocked、path traversal blocked、state 不写入。
- 禁止事项：不做新产品功能；不新增依赖。
- 验证建议：focused route smoke、`pnpm check`、`pnpm test`、`git diff --check`。

### Task 10：docs and operator guide

- 风险：文档夸大能力导致误用。
- 范围：README / operator guide / v16 docs 更新，解释 handoff、preview、安全边界。
- Acceptance：文档与实现一致，明确 Workbench 仍为 read-only / copy-only。
- 禁止事项：不写未实现命令；不改发布状态除非 release task 明确要求。
- 验证建议：文档 review、`git diff --check`。

### Task 11：release verification

- 风险：release gate 只由 writer 自证。
- 范围：在 `main` 上跑发布级验证并记录中文 release evidence。
- Acceptance：验证命令真实记录；失败不伪造成通过；安全边界复核。
- 禁止事项：不混入功能；不修 audit 除非单独批准。
- 验证建议：`pnpm check`、`pnpm test`、`pnpm workbench:build`、focused tests、audit high、safety scan。

### Task 12：closure

- 风险：遗留 contract gap 被误认为已完成。
- 范围：整理 v16 final closure evidence、task index、支持能力、明确不支持能力、backlog。
- Acceptance：closure 文档准确；不删除历史 evidence；ready for tag review。
- 禁止事项：不做新功能；不创建 tag；不推送。
- 验证建议：`git log --oneline -12`、`git diff --check`、依赖 diff 为空。

## 依赖策略

默认不新增依赖，不修改 `package.json` / `pnpm-lock.yaml`。如需要以下任一项，必须先单独写 dependency plan 并通过 independent reviewer：

- browser / E2E 工具。
- UI framework 或 icon library。
- TypeScript。
- 新测试 runner。
- 新 MIME / sanitizer / markdown renderer 库。

dependency plan 必须说明 direct dependency、transitive risk、license/security、替代方案、移除策略和验证命令。

## Review Model

- worker 与 reviewer 必须 context 隔离。
- worker 自测只算 self-check，不算最终验收。
- reviewer 只读 diff 并自己核对仓库事实，不依赖 worker 总结。
- reviewer 输出 `APPROVED` 后，才允许 commit / push / merge。
- verifier 在 merge 回 `main` 后从主线重跑验证。
- release evidence 由独立 release verification task 汇总，不由任一 feature task 自行宣称 release ready。

## Release Gates

v16 release 前必须满足：

- Task 1-12 均有中文 evidence。
- 每个 task 有独立 review gate 记录。
- `main` 上 `pnpm check` 通过。
- `main` 上 `pnpm test` 通过。
- `main` 上 `pnpm workbench:build` 通过。
- `git diff --check` 无输出。
- `git diff -- package.json pnpm-lock.yaml` 符合批准的 dependency plan；若无 dependency plan 必须无输出。
- handoff route 与 preview route focused tests 通过。
- non-GET API / Workbench mutation probes 被拒绝。
- arbitrary path / traversal probes 被拒绝。
- v12/v14/v15 safety boundary 未被越界修改。

## Stop Conditions

任一 task 出现以下情况立即停止：

- 计划外修改源码、测试、前端、server、kernel 或依赖文件。
- 未批准新增依赖或 lockfile diff。
- Workbench 出现写入、执行、模型、audit、mutation、安装、adopt/apply/retry/rollback 控件。
- 后端 route 接受 arbitrary path 或暴露本地任意文件。
- 前端推断 artifact safety fields。
- reviewer 返回 `NEEDS_REVISION`。
- 验证失败且无法判断是环境问题还是真实 blocker。
- evidence 缺失、英文为主或删除历史 evidence。
