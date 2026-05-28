# v18 Execution Prompts：Goal Event Journal + Evidence Recorder

日期：2026-05-28
状态：draft prompt pack
基线：v17 已发布能力
目标仓库：`Andy20010101/multi-coding-agent-symphony`

## 使用方式

这些 prompt 用于后续 v18 实施。本文档本身不执行命令，不创建分支，不合并，不打 tag。

所有命令块均为 copy-only。复制后是否执行由操作者决定，Workbench 不会执行这些命令。

每个 task 必须分三步：

1. worker implement：实现当前 task，自测并登记 worker evidence。
2. independent reviewer review：独立 reviewer 只读审查 diff、测试和安全边界，返回 `APPROVED` 或 `NEEDS_REVISION`。
3. main land/post-merge verification：只有 reviewer approved 后才准备合并，并在 main 上登记验证 evidence。

同一个 agent 禁止自写自批自合并。worker self-check 不能算 reviewer approval。

全局边界：

- v18 不包含 Autopilot。
- v18 不包含 Workbench execution。
- v18 不包含 browser terminal。
- v18 不包含 artifact download。
- v18 不包含 open local file。
- v18 不包含 arbitrary path preview。
- v18 不包含 model invocation。
- v18 不包含自动 merge。
- v18 不包含自动 tag。
- Workbench 继续只读展示。
- CLI 只在 confirm 阶段 append-only 登记目标事件。
- 不自动推断 `approved`、`main-verified`、`release-ready`。

---

## 总控 Prompt

```text
/goal
你是 v18 总控 agent，负责按任务顺序推进 multi-coding-agent-symphony 的 v18：Goal Event Journal + Evidence Recorder。

基线：
- v16 已提供 guided-goal-handoff.v1 和 safe-artifact-preview.v1。
- v17 已提供 read-only goal-progress-ledger.v1、capabilities.v1、diagnostics.v1、error-envelope.v1。

v18 目标：
- 新增 goal-event-log.v1 append-only 目标事件日志。
- 新增 goal-update-plan.v1 dry-run 计划合同。
- 新增 symphony goal update/review/gate 的 dry-run/confirm 双阶段 CLI。
- 用 event log resolver 生成 goal-progress-ledger.v1。
- 新增 GET /api/goals/latest/events 和 GET /api/goals/<goal-id>/events。
- Workbench 新增 Goal Events Timeline 和 Evidence Matrix，只读展示。
- 没有 events 时，goal-status 仍返回 v17 planned/unknown 模板。

执行规则：
- 每个 task 单独分支。
- 每个 task 必须有 worker implement、independent reviewer review、main land/post-merge verification。
- worker 可以自测，但不能自批。
- reviewer 必须独立读 diff、测试和安全边界，不能只复述 worker 总结。
- reviewer 返回 APPROVED 后，才允许进入 land prompt。
- reviewer 返回 NEEDS_REVISION 时，只修 blocker，不扩 scope。
- 不让同一个 agent 自写自批自合并。

硬边界：
- 不做 Autopilot。
- 不做 Workbench execution。
- 不做 browser terminal。
- 不做 artifact download。
- 不做 open local file。
- 不做 arbitrary path preview。
- 不做 model invocation。
- 不做自动 merge 或自动 tag。
- Workbench 不写 event log。
- 浏览器不执行 CLI、shell、模型、review、gate。
- 不根据分支名、文件名、命令文本、任务标题、路径自动推断 approved/main-verified/release-ready。

任务顺序：
1. goal-event-log.v1 和 goal-update-plan.v1 合同。
2. append-only event journal writer。
3. symphony goal update。
4. symphony goal review。
5. symphony goal gate。
6. event resolver 到 goal-progress-ledger.v1。
7. read-only events API。
8. Workbench Goal Events Timeline 和 Evidence Matrix。
9. route smoke 和安全边界回归。
10. docs、operator guide、release evidence。

Release gates：
- pnpm check
- pnpm test
- pnpm workbench:build
- pnpm test:mutation:gate
- pnpm audit --audit-level high
- git diff --check
- pnpm mcas doctor

每次返回：
- 当前 task 和角色
- 变更摘要
- 文件列表
- 验证命令和结果
- 安全边界确认
- 是否需要 reviewer 或 land
```

---

## Task 1 Worker Prompt：合同 fixtures 和 validator

```text
/goal
执行 v18 Task 1 worker implement：新增 goal-event-log.v1 和 goal-update-plan.v1 合同 fixtures、validator 和测试。

分支：
- 从最新 main 创建或使用：v18-task1-goal-event-contracts

先读：
- docs/plans/v18-goal-event-journal-evidence-recorder-plan-2026-05-28.md
- 现有 v17 goal-progress-ledger、capabilities、diagnostics、error-envelope 合同和测试模式

实现范围：
- goal-event-log.v1 合同 validator。
- goal-update-plan.v1 合同 validator。
- valid fixtures：
  - empty event log
  - worker self-check event
  - reviewer approved event
  - reviewer needs-revision event
  - main verification passed event
  - release gate passed/failed event
  - release ready declared event
  - dry-run goal-update-plan
- invalid fixtures/tests：
  - 缺 contractName/contractVersion
  - 非法 eventType
  - 非法 phase
  - 非法 actor role
  - evidence ref 含 absolute path、file://、../、~/
  - 缺 planHash
  - dry-run 声称会写入

禁止：
- 不实现 CLI。
- 不实现 API。
- 不实现 Workbench。
- 不写 event journal。
- 不改 release 状态。
- 不新增依赖，除非先单独批准。

验收命令块仅供复制执行：
pnpm check
pnpm test
git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Contract boundary notes
- Reviewer handoff
```

### Task 1 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 1：goal-event-log.v1 和 goal-update-plan.v1 合同。

你是 independent reviewer。只读审查，除非仓库流程明确要求写 reviewer evidence，否则不要修改文件。

检查：
- 两个合同名和版本稳定。
- valid fixtures 覆盖 empty log、worker、reviewer、main verification、release gate、release ready、dry-run plan。
- invalid tests 覆盖缺字段、非法 enum、危险 evidence ref、缺 planHash、dry-run 写入声明。
- 没有 CLI/API/Workbench scope creep。
- 没有新增依赖或 lockfile diff，除非有批准计划。
- 不允许从文件名、路径、命令文本推断 approved/main-verified/release-ready。
- pnpm check、pnpm test、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 2 Worker Prompt：append-only event journal writer

```text
/goal
执行 v18 Task 2 worker implement：新增受控 append-only event journal writer。

分支：
- 从 Task 1 合并后的最新 main 创建：v18-task2-event-journal-writer

先读：
- Task 1 合同和 validator。
- 现有 .symphony state 读写模式。
- v16/v17 对 arbitrary path、registered refs、safe errors 的处理方式。

实现范围：
- 受控 event journal append writer。
- sequence 分配。
- previousEventHash/eventHash 计算和校验。
- eventId 幂等处理。
- confirm 写入只 append。
- dry-run 不写入。
- chain 失败时拒绝追加并返回安全错误。
- tests 证明不能删除、修改、重排历史事件。

禁止：
- 不实现 symphony goal update/review/gate。
- 不实现 API。
- 不实现 Workbench。
- 不接受任意 path 作为 journal 位置。
- 不写 evidence 文档。

验收命令块仅供复制执行：
pnpm check
pnpm test
git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Append-only safety notes
- Reviewer handoff
```

### Task 2 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 2：append-only event journal writer。

你是 independent reviewer。只读审查。

检查：
- writer 只写受控 journal，不接受任意 path。
- dry-run 不写入。
- confirm 只 append，不修改、不删除、不重排历史。
- sequence 和 hash chain 有测试。
- eventId 幂等逻辑不会重复追加同一事件。
- chain 失败不会生成乐观状态。
- 没有 CLI/API/Workbench scope creep。
- pnpm check、pnpm test、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 3 Worker Prompt：`symphony goal update`

```text
/goal
执行 v18 Task 3 worker implement：新增 symphony goal update 的 dry-run/confirm 双阶段 CLI。

分支：
- 从 Task 2 合并后的最新 main 创建：v18-task3-goal-update-cli

实现范围：
- symphony goal update --dry-run 默认输出 goal-update-plan.v1。
- symphony goal update --confirm --plan-hash <hash> 追加 worker/task-level event。
- 支持 worker.started、worker.evidence-recorded、worker.self-check-passed、worker.self-check-failed、blocker.opened、blocker.resolved。
- confirm 重新计算 plan hash，输入不一致时拒绝写入。
- worker self-check 只生成 self-checked，不生成 approved。
- evidence ref 校验沿用 Task 1 规则。
- tests 覆盖 dry-run 无写入、confirm append、hash mismatch 拒绝、危险 evidence ref 拒绝。

禁止：
- 不实现 review/gate CLI。
- 不登记 reviewer.approved。
- 不登记 main.verification-passed。
- 不登记 release.ready-declared。
- 不调用模型。
- 不运行测试命令作为 CLI 行为。

验收命令块仅供复制执行：
symphony goal update --goal v18-goal-event-journal-evidence-recorder --task task-1 --event worker.started --actor codex-worker-task-1 --dry-run
pnpm check
pnpm test
git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Dry-run/confirm behavior
- Safety boundary notes
- Reviewer handoff
```

### Task 3 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 3：symphony goal update。

你是 independent reviewer。只读审查。

检查：
- dry-run 默认输出 goal-update-plan.v1 且无写入。
- confirm 必须带 --plan-hash，并重新校验输入。
- confirm 只追加 worker/task-level event。
- worker self-check 不会变成 approved。
- CLI 不运行测试、audit、mutation、模型或 shell 子命令。
- 危险 evidence ref 被拒绝。
- tests 覆盖 hash mismatch、dry-run no-write、confirm append。
- pnpm check、pnpm test、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 4 Worker Prompt：`symphony goal review`

```text
/goal
执行 v18 Task 4 worker implement：新增 symphony goal review 的 dry-run/confirm 双阶段 CLI。

分支：
- 从 Task 3 合并后的最新 main 创建：v18-task4-goal-review-cli

实现范围：
- symphony goal review --dry-run 输出 goal-update-plan.v1。
- symphony goal review --confirm --plan-hash <hash> 追加 reviewer verdict event。
- 支持 verdict approved 和 needs-revision。
- approved 映射 reviewer.approved。
- needs-revision 映射 reviewer.needs-revision。
- reviewer evidence ref 必填。
- reviewer id 不能等于同 task 最近 worker id。
- tests 覆盖 approved、needs-revision、缺 evidence、reviewer=worker 拒绝、hash mismatch。

禁止：
- 不实现 goal gate。
- 不自动合并。
- 不根据 review 文档标题、文件名或正文推断 verdict。
- 不调用模型。
- 不让 Workbench 写入。

验收命令块仅供复制执行：
symphony goal review --goal v18-goal-event-journal-evidence-recorder --task task-1 --reviewer codex-reviewer-task-1 --verdict approved --evidence-ref docs/plans/v18-task1-review-evidence-2026-05-28.md --dry-run
pnpm check
pnpm test
git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Review role isolation notes
- Reviewer handoff
```

### Task 4 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 4：symphony goal review。

你是 independent reviewer。只读审查。

检查：
- review CLI 只登记 reviewer verdict event。
- approved/needs-revision 都需要明确 CLI verdict 和 evidence ref。
- reviewer id 与最近 worker id 冲突会拒绝。
- CLI 不从文本、路径、文件名推断 verdict。
- dry-run 无写入，confirm append-only。
- 没有 gate/main/release scope creep。
- pnpm check、pnpm test、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 5 Worker Prompt：`symphony goal gate`

```text
/goal
执行 v18 Task 5 worker implement：新增 symphony goal gate 的 dry-run/confirm 双阶段 CLI。

分支：
- 从 Task 4 合并后的最新 main 创建：v18-task5-goal-gate-cli

实现范围：
- symphony goal gate --dry-run 输出 goal-update-plan.v1。
- symphony goal gate --confirm --plan-hash <hash> append gate event。
- 支持 main-verification passed/failed。
- 支持 release gate passed/failed。
- 支持 release.ready declared。
- main-verification passed 映射 main.verification-passed。
- main-verification failed 映射 main.verification-failed。
- release gate passed/failed 映射 release.gate-passed/release.gate-failed。
- release.ready declared 映射 release.ready-declared。
- release.ready-declared 需要 release evidence ref。
- tests 覆盖 release-ready 不因全部 gate passed 自动出现。

禁止：
- CLI 不自动运行 pnpm check/test/workbench build/audit/mutation/doctor。
- CLI 不自动 tag。
- CLI 不自动 merge。
- CLI 不调用模型。
- CLI 不从命令名字推断 gate 通过。

验收命令块仅供复制执行：
symphony goal gate --goal v18-goal-event-journal-evidence-recorder --gate release.pnpm-check --status passed --verifier codex-release-verifier --evidence-ref docs/plans/v18-release-evidence-2026-05-28.md --dry-run
pnpm check
pnpm test
git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Release gate explicitness notes
- Reviewer handoff
```

### Task 5 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 5：symphony goal gate。

你是 independent reviewer。只读审查。

检查：
- gate CLI 支持 main verification 和 release gate event。
- dry-run 无写入，confirm append-only。
- release.ready-declared 必须显式登记。
- 全部 release gate passed 不会自动生成 release-ready。
- CLI 不运行 pnpm 命令、不 audit、不 mutation、不 doctor、不 tag、不 merge。
- evidence ref 校验有效。
- pnpm check、pnpm test、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 6 Worker Prompt：event resolver 到 `goal-progress-ledger.v1`

```text
/goal
执行 v18 Task 6 worker implement：新增 event log 到 goal-progress-ledger.v1 的 resolver 规则。

分支：
- 从 Task 5 合并后的最新 main 创建：v18-task6-event-ledger-resolver

实现范围：
- resolver 读取 goal-event-log.v1 和 v17 handoff/goal state。
- 无 events 时返回 v17 planned/unknown 模板。
- statusSource 明确标记 goal-event-log.v1 或 v17-template-no-events。
- worker.started -> in-progress。
- worker.self-check-passed -> self-checked。
- reviewer.approved -> approved。
- reviewer.needs-revision -> needs-revision。
- main.merged -> merged-to-main。
- main.verification-passed -> main-verified。
- blocker.opened 未解决 -> blocked。
- release.ready-declared -> release-ready。
- release-ready 不由 gate 全 passed 自动推断。
- tests 覆盖 no-events、missing evidence、needs-revision、approved、main-verified、blocked、release-ready declared。

禁止：
- 不读取 evidence ref 正文。
- 不接受任意 path。
- 不调用模型。
- 不执行命令。
- 不写 ledger 文件。

验收命令块仅供复制执行：
pnpm check
pnpm test
git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Resolver mapping notes
- Reviewer handoff
```

### Task 6 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 6：event resolver 到 goal-progress-ledger.v1。

你是 independent reviewer。只读审查。

检查：
- 无 events 时保持 v17 planned/unknown 行为。
- approved 只来自 reviewer.approved。
- main-verified 只来自 main.verification-passed。
- release-ready 只来自 release.ready-declared。
- needs-revision、blocked、missing evidence 显示正确。
- resolver 不读取 evidence ref 正文、不接受任意 path、不执行命令、不调用模型。
- tests 覆盖关键状态和优先级。
- pnpm check、pnpm test、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 7 Worker Prompt：read-only events API

```text
/goal
执行 v18 Task 7 worker implement：新增 read-only events API。

分支：
- 从 Task 6 合并后的最新 main 创建：v18-task7-events-api

实现范围：
- GET /api/goals/latest/events。
- GET /api/goals/<goal-id>/events。
- 成功响应返回 goal-event-log.v1。
- 没有 events 返回 events: [] 的有效合同。
- unknown goal 返回 error-envelope.v1 404。
- 非 GET 返回 error-envelope.v1 405。
- query path、encoded traversal、absolute path、file://、~/ 不触发文件读取。
- route smoke 覆盖 happy path、empty log、unknown goal、non-GET、traversal。

禁止：
- 不新增 POST/PUT/PATCH/DELETE。
- 不让 API 写 event log。
- 不返回本地绝对路径、stack trace、secret、repo 文件正文。
- 不实现 Workbench UI。

验收命令块仅供复制执行：
pnpm check
pnpm test
git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- API safety notes
- Reviewer handoff
```

### Task 7 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 7：read-only events API。

你是 independent reviewer。只读审查。

检查：
- 两个 events API route 存在且只允许 GET。
- empty log 返回有效 goal-event-log.v1。
- unknown goal 和 non-GET 使用 safe error envelope。
- traversal、query path、absolute path、file://、~/ 不会导致任意文件读取。
- API 不写 event log。
- 响应不泄漏绝对路径、stack trace、secret、repo 文件正文。
- pnpm check、pnpm test、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 8 Worker Prompt：Workbench Goal Events Timeline 和 Evidence Matrix

```text
/goal
执行 v18 Task 8 worker implement：新增 Workbench Goal Events Timeline 和 Evidence Matrix，只读展示。

分支：
- 从 Task 7 合并后的最新 main 创建：v18-task8-workbench-events-matrix

实现范围：
- Workbench 只 GET events API 和 existing ledger API。
- Goal Events Timeline 展示 sequence、eventType、phase、taskId、actor、recordedAt、verdict/gate status、evidence refs、hash chain status。
- Evidence Matrix 展示每个 task 的 worker evidence、review verdict、review evidence、main verification、blocker、release gate coverage。
- 缺失字段显示 missing/unknown。
- approved 只在 reviewer.approved event 存在时显示。
- main-verified 只在 main.verification-passed event 存在时显示。
- release-ready 只在 release.ready-declared event 存在时显示。

禁止：
- 不新增 Workbench 写入。
- 不新增 browser execution。
- 不新增 browser terminal。
- 不新增 artifact download。
- 不新增 open local file。
- 不新增 arbitrary path preview。
- 不新增 model invocation。
- 不从 evidence ref 读取正文。
- 不根据路径、扩展名、任务标题、分支名、命令文本推断状态。

验收命令块仅供复制执行：
pnpm workbench:build
pnpm check
pnpm test
git diff --check

返回：
- Summary
- Files changed
- Tests/build run with exact results
- Workbench read-only notes
- Reviewer handoff
```

### Task 8 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 8：Workbench Goal Events Timeline 和 Evidence Matrix。

你是 independent reviewer。只读审查。

检查：
- Workbench 只调用 GET events/ledger API。
- Timeline 和 Matrix 展示后端字段，不推断状态。
- 缺失 evidence 显示 missing/unknown。
- 没有写入、执行、terminal、download、open local file、arbitrary path preview、model invocation。
- 没有从 evidence ref 读取正文。
- pnpm workbench:build、pnpm check、pnpm test、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 9 Worker Prompt：route smoke 和安全边界回归

```text
/goal
执行 v18 Task 9 worker implement：扩展 route smoke 和安全边界回归测试。

分支：
- 从 Task 8 合并后的最新 main 创建：v18-task9-route-smoke-security

覆盖范围：
- v16 handoff routes。
- v16 safe preview routes。
- v17 goal progress routes。
- v17 capabilities/diagnostics/error envelope routes。
- v18 events routes。
- Workbench fallback。
- Stage Charter boundary。
- non-GET 405。
- encoded traversal。
- query path。
- absolute path。
- file:// 和 ~/。
- raw HTML/SVG/JS/binary inline prevention where applicable。
- Workbench 无执行、写入、下载、打开本地文件、模型调用入口。

禁止：
- 不新增产品功能。
- 不修改合同语义。
- 不放宽 route allowlist。
- 不新增依赖，除非先批准。

验收命令块仅供复制执行：
pnpm check
pnpm test
pnpm workbench:build
git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Boundary coverage map
- Reviewer handoff
```

### Task 9 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 9：route smoke 和安全边界回归。

你是 independent reviewer。只读审查。

检查：
- v16/v17/v18 只读 routes 都有 smoke/security coverage。
- non-GET 405、traversal、query path、absolute path、file://、~/ 有覆盖。
- Workbench fallback 和 Stage Charter boundary 没有回归。
- 静态扫描能说明没有执行、写入、下载、打开本地文件、模型调用入口。
- 没有产品功能 scope creep。
- pnpm check、pnpm test、pnpm workbench:build、git diff --check 通过。

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## Task 10 Worker Prompt：docs、operator guide、release evidence

```text
/goal
执行 v18 Task 10 worker implement：更新 docs、operator guide、release evidence，并准备 release evidence。

分支：
- 从 Task 9 合并后的最新 main 创建：v18-task10-docs-release-evidence

更新范围：
- README 当前能力和 v18 milestone。
- Workbench Operator Guide。
- 合同文档或索引。
- v18 release evidence。
- task evidence index。

文档必须说明：
- goal-event-log.v1。
- goal-update-plan.v1。
- symphony goal update/review/gate dry-run/confirm。
- event log resolver 到 goal-progress-ledger.v1。
- GET /api/goals/latest/events。
- GET /api/goals/<goal-id>/events。
- Workbench Goal Events Timeline。
- Workbench Evidence Matrix。
- 无 events 时保持 v17 planned/unknown 模板。
- v18 不包含 Autopilot、Workbench execution、browser terminal、artifact download、open local file、arbitrary path preview、model invocation、自动 merge 或自动 tag。

最终 release gate 命令块仅供复制执行：
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
pnpm mcas doctor

禁止：
- 不创建 tag，除非用户在 release evidence 审查后明确要求。
- 不自动 merge。
- 不修改功能代码，除非文档索引测试要求的最小变更已经在本 task 范围内批准。

返回：
- Summary
- Files changed
- Full command evidence
- Release readiness: READY or BLOCKED
- Remaining blockers
- Reviewer handoff
```

### Task 10 Independent Reviewer Prompt

```text
/goal
审查 v18 Task 10：docs、operator guide、release evidence。

你是 independent reviewer。只读审查。

检查：
- README 和 operator guide 准确描述 v18，不夸大 Workbench/CLI 能力。
- 合同索引包含 goal-event-log.v1 和 goal-update-plan.v1。
- release evidence 包含所有 task 的 worker/reviewer/main verification evidence。
- release evidence 包含 release gate 结果。
- 明确 v18 不包含 Autopilot、Workbench execution、browser terminal、artifact download、open local file、arbitrary path preview、model invocation、自动 merge 或自动 tag。
- 没有创建 tag，除非用户明确要求。
- 最终命令通过：
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - pnpm test:mutation:gate
  - pnpm audit --audit-level high
  - git diff --check
  - pnpm mcas doctor

返回且只返回一种 verdict：
- APPROVED，附证据和命令结果。
- NEEDS_REVISION，列出 blocker、文件和行号。
```

---

## 通用 Revision Prompt

```text
/goal
修复当前 v18 task branch 的 reviewer blockers。

Reviewer verdict:
NEEDS_REVISION

Reviewer blockers:
<粘贴 reviewer 原文 blocker>

规则：
- 只修当前 task 的 blocker。
- 不扩 scope。
- 不新增未批准依赖。
- 保持 v18 安全边界。
- 补充或调整测试。
- 重新运行当前 task 的验收命令。

返回：
- 修复摘要
- 每个 blocker 的处理方式
- 命令结果
- 剩余风险
- 是否需要再次 review
```

---

## Main Land / Post-merge Verification Prompt

```text
/goal
执行 v18 task 的 main land/post-merge verification。只有 independent reviewer 返回 APPROVED 后才能使用本 prompt。

Task:
<粘贴 task 编号和标题>

Branch:
<粘贴 task branch>

Reviewer verdict:
APPROVED

要求：
- 确认 branch 基于最新 main 或可干净合并。
- 复核 reviewer approval evidence。
- 复核本 task 没有超出 scope。
- 运行该 task 的验收命令。
- git diff --check 必须无输出。
- 准备 main/post-merge verification evidence。
- 如需要登记 main verification event，使用 symphony goal gate 的 dry-run/confirm 双阶段。
- 不自动 merge，除非用户明确要求你执行 merge。
- 不自动 push。
- 不自动 tag。

命令块仅供复制执行：
git status -sb
git diff --check

返回：
- Land readiness: READY or BLOCKED
- Commands run and results
- Files changed
- Reviewer evidence checked
- Main verification evidence path
- Merge blockers
```

---

## Release Evidence 和 Tag Prep Prompt

```text
/goal
准备 v18 release evidence 和 tag prep。只有所有 task 已合并到 main，且 Task 10 reviewer 返回 APPROVED 后才能使用本 prompt。

范围：
- v18 Goal Event Journal + Evidence Recorder。

确认已实现：
- goal-event-log.v1。
- goal-update-plan.v1。
- symphony goal update dry-run/confirm。
- symphony goal review dry-run/confirm。
- symphony goal gate dry-run/confirm。
- event log resolver 到 goal-progress-ledger.v1。
- 无 events 时保持 v17 planned/unknown。
- GET /api/goals/latest/events。
- GET /api/goals/<goal-id>/events。
- Workbench Goal Events Timeline。
- Workbench Evidence Matrix。
- route smoke/security coverage。
- docs/operator guide/release evidence。

硬边界复核：
- 不包含 Autopilot。
- 不包含 Workbench execution。
- 不包含 browser terminal。
- 不包含 artifact download。
- 不包含 open local file。
- 不包含 arbitrary path preview。
- 不包含 model invocation。
- 不包含自动 merge。
- 不包含自动 tag。
- 不自动推断 approved/main-verified/release-ready。

最终 release gate 命令块仅供复制执行：
git status -sb
git log --oneline -8
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
pnpm mcas doctor

Tag prep：
- 不创建 tag，除非用户明确要求。
- 如果 release readiness 为 READY，只输出建议 tag 命令文本。
- tag 命令必须标注 copy-only。

返回：
- Final release readiness: READY or BLOCKED
- Command evidence and exact results
- Event log/release gate evidence summary
- Safety boundary confirmation
- Remaining blockers
- Suggested tag command as copy-only text, only if READY
```
